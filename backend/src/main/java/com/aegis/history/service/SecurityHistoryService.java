package com.aegis.history.service;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.SecurityAssessmentRepository;
import com.aegis.finding.entity.SecurityFinding;
import com.aegis.finding.repository.SecurityFindingRepository;
import com.aegis.history.dto.SecurityHistoryTimelineDto;
import com.aegis.monitoring.entity.MonitoringConfiguration;
import com.aegis.monitoring.repository.MonitoringConfigurationRepository;
import com.aegis.posture.entity.SecurityPostureSnapshot;
import com.aegis.posture.entity.SecurityRegression;
import com.aegis.posture.repository.SecurityPostureSnapshotRepository;
import com.aegis.posture.repository.SecurityRegressionRepository;
import com.aegis.retest.entity.DefenseValidation;
import com.aegis.retest.repository.DefenseValidationRepository;
import com.aegis.target.SecurityTarget;
import com.aegis.target.SecurityTargetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SecurityHistoryService {

    private final SecurityTargetRepository targetRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final SecurityFindingRepository findingRepository;
    private final DefenseValidationRepository defenseValidationRepository;
    private final SecurityPostureSnapshotRepository postureSnapshotRepository;
    private final SecurityRegressionRepository regressionRepository;
    private final MonitoringConfigurationRepository monitoringRepository;

    @Transactional(readOnly = true)
    public SecurityHistoryTimelineDto getTargetSecurityHistory(UUID targetId) {
        SecurityTarget target = targetRepository.findById(targetId)
            .orElseThrow(() -> new IllegalArgumentException("Target not found: " + targetId));

        SecurityPostureSnapshot currentPosture = postureSnapshotRepository.findTopByTargetIdOrderByCalculatedAtDesc(targetId).orElse(null);
        int score = currentPosture != null ? currentPosture.getOverallScore() : 0;
        String risk = currentPosture != null ? currentPosture.getRiskLevel().name() : "INSUFFICIENT_DATA";

        List<SecurityHistoryTimelineDto.TimelineEventItem> events = new ArrayList<>();

        // 1. Assessment Events
        List<SecurityAssessment> assessments = assessmentRepository.findByTargetIdOrderByCreatedAtDesc(targetId);
        for (SecurityAssessment a : assessments) {
            events.add(new SecurityHistoryTimelineDto.TimelineEventItem(
                a.getId().toString(),
                "ASSESSMENT",
                "Assessment " + a.getStatus().name(),
                "Assessment profile: " + (a.getProfile() != null ? a.getProfile().getName() : "Standard") + " completed with status " + a.getStatus(),
                "INFO",
                a.getCompletedAt() != null ? a.getCompletedAt() : a.getCreatedAt(),
                "SECURITY_ASSESSMENT",
                a.getId().toString()
            ));
        }

        // 2. Finding Events
        List<SecurityFinding> findings = findingRepository.findByAssessmentTargetId(targetId);
        for (SecurityFinding f : findings) {
            events.add(new SecurityHistoryTimelineDto.TimelineEventItem(
                f.getId().toString(),
                "FINDING_CHANGE",
                "Finding: " + f.getTitle(),
                "Severity: " + f.getSeverity() + " | Status: " + f.getStatus(),
                f.getSeverity().name(),
                f.getCreatedAt(),
                "SECURITY_FINDING",
                f.getId().toString()
            ));
        }

        // 3. Defense Validation Events
        List<DefenseValidation> valList = defenseValidationRepository.findByFindingAssessmentTargetId(targetId);
        for (DefenseValidation v : valList) {
            events.add(new SecurityHistoryTimelineDto.TimelineEventItem(
                v.getId().toString(),
                "DEFENSE_VALIDATION",
                "Defense Validation: " + v.getValidationStatus(),
                v.getSummary(),
                v.getValidationStatus().name().contains("FIXED") ? "INFO" : "HIGH",
                v.getValidatedAt() != null ? v.getValidatedAt().toInstant() : Instant.now(),
                "DEFENSE_VALIDATION",

                v.getId().toString()
            ));
        }

        // 4. Regression Events
        List<SecurityRegression> regressions = regressionRepository.findByTargetIdOrderByDetectedAtDesc(targetId);
        for (SecurityRegression r : regressions) {
            events.add(new SecurityHistoryTimelineDto.TimelineEventItem(
                r.getId().toString(),
                "REGRESSION",
                "Vulnerability Regression: " + r.getRegressionType(),
                r.getExplanation(),
                "CRITICAL",
                r.getDetectedAt(),
                "SECURITY_REGRESSION",
                r.getId().toString()
            ));
        }

        // Sort events chronologically descending
        events.sort(Comparator.comparing(SecurityHistoryTimelineDto.TimelineEventItem::timestamp).reversed());

        return new SecurityHistoryTimelineDto(
            target.getId().toString(),
            target.getName(),
            target.getPrimaryUrl(),
            score,
            risk,
            events
        );
    }
}
