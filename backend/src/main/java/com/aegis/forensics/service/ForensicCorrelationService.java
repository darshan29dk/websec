package com.aegis.forensics.service;

import com.aegis.forensics.entity.*;
import com.aegis.forensics.enums.*;
import com.aegis.forensics.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForensicCorrelationService {

    private final ForensicTimelineEventRepository timelineRepository;
    private final ForensicAttackEventRepository attackEventRepository;
    private final ForensicEvidenceRepository evidenceRepository;

    @Transactional
    public void correlateEvidenceForCase(ForensicCase forensicCase) {
        log.info("Executing deterministic forensic evidence correlation for case: {}", forensicCase.getCaseNumber());

        List<ForensicEvidence> evidences = evidenceRepository.findByForensicCaseIdOrderByCollectionTimeDesc(forensicCase.getId());
        if (evidences.isEmpty()) {
            return;
        }

        int seq = 1;
        for (ForensicEvidence ev : evidences) {
            TimelineEventType type = mapEvidenceTypeToTimelineEvent(ev.getEvidenceType());

            ForensicTimelineEvent timelineEvent = ForensicTimelineEvent.builder()
                    .forensicCase(forensicCase)
                    .eventTime(ev.getEventTime())
                    .timeDescription(ev.getEventTime() == null ? "Occurred near collection time" : null)
                    .eventType(type)
                    .source(ev.getSourceType().name())
                    .severity(ev.getConfidence() == EvidenceConfidence.HIGH ? "HIGH" : "MEDIUM")
                    .title(ev.getEvidenceType().name() + " Evidence Observed")
                    .description(ev.getDescription())
                    .evidence(ev)
                    .confidence(ev.getConfidence())
                    .sequenceNumber(seq++)
                    .build();

            timelineEvent = timelineRepository.save(timelineEvent);

            AttackStage stage = mapToAttackStage(ev.getEvidenceType(), ev.getDescription());
            if (stage != null) {
                ForensicAttackEvent attackEvent = ForensicAttackEvent.builder()
                        .forensicCase(forensicCase)
                        .timelineEvent(timelineEvent)
                        .eventType(ev.getEvidenceType().name())
                        .stage(stage)
                        .eventTime(ev.getEventTime())
                        .evidence(ev)
                        .confidence(ev.getConfidence())
                        .classification(ev.getClassification())
                        .description(ev.getDescription())
                        .build();

                attackEventRepository.save(attackEvent);
            }
        }
    }

    private TimelineEventType mapEvidenceTypeToTimelineEvent(EvidenceType type) {
        return switch (type) {
            case HTTP_REQUEST -> TimelineEventType.HTTP_REQUEST;
            case HTTP_RESPONSE -> TimelineEventType.HTTP_RESPONSE;
            case NETWORK_EVENT -> TimelineEventType.NETWORK_CONNECTION;
            case APPLICATION_LOG -> TimelineEventType.SUSPICIOUS_REQUEST;
            case AUTHENTICATION_EVENT -> TimelineEventType.AUTHENTICATION;
            case ASSESSMENT_EVENT, TOOL_OUTPUT -> TimelineEventType.ASSESSMENT_EVENT;
            default -> TimelineEventType.OTHER;
        };
    }

    private AttackStage mapToAttackStage(EvidenceType type, String description) {
        if (type == EvidenceType.ASSESSMENT_EVENT || type == EvidenceType.TOOL_OUTPUT) {
            return AttackStage.DISCOVERY;
        }
        if (type == EvidenceType.HTTP_REQUEST || type == EvidenceType.APPLICATION_LOG) {
            if (description != null && description.toLowerCase().contains("injection")) {
                return AttackStage.VULNERABILITY_INTERACTION;
            }
            return AttackStage.SUSPICIOUS_REQUEST;
        }
        if (type == EvidenceType.AUTHENTICATION_EVENT) {
            return AttackStage.AUTHENTICATION_ACTIVITY;
        }
        if (type == EvidenceType.NETWORK_EVENT) {
            return AttackStage.INITIAL_ACCESS;
        }
        return null;
    }
}
