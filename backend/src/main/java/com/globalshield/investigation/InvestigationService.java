package com.globalshield.investigation;

import com.globalshield.attackchain.AttackChain;
import com.globalshield.attackchain.AttackChainService;
import com.globalshield.detection.DetectionConfidence;
import com.globalshield.event.SecurityEvent;
import com.globalshield.event.SecurityEventRepository;
import com.globalshield.incident.SecurityIncident;
import com.globalshield.incident.SecurityIncidentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InvestigationService {

    private final InvestigationRepository investigationRepository;
    private final InvestigationHypothesisRepository hypothesisRepository;
    private final InvestigationEvidenceRepository evidenceRepository;
    private final HypothesisEvidenceRepository hypothesisEvidenceRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final InvestigationNoteRepository noteRepository;
    private final SecurityIncidentRepository incidentRepository;
    private final SecurityEventRepository securityEventRepository;
    private final AttackChainService attackChainService;

    public InvestigationService(InvestigationRepository investigationRepository,
                                InvestigationHypothesisRepository hypothesisRepository,
                                InvestigationEvidenceRepository evidenceRepository,
                                HypothesisEvidenceRepository hypothesisEvidenceRepository,
                                TimelineEventRepository timelineEventRepository,
                                InvestigationNoteRepository noteRepository,
                                SecurityIncidentRepository incidentRepository,
                                SecurityEventRepository securityEventRepository,
                                AttackChainService attackChainService) {
        this.investigationRepository = investigationRepository;
        this.hypothesisRepository = hypothesisRepository;
        this.evidenceRepository = evidenceRepository;
        this.hypothesisEvidenceRepository = hypothesisEvidenceRepository;
        this.timelineEventRepository = timelineEventRepository;
        this.noteRepository = noteRepository;
        this.incidentRepository = incidentRepository;
        this.securityEventRepository = securityEventRepository;
        this.attackChainService = attackChainService;
    }

    public Page<Investigation> getInvestigations(int page, int size, InvestigationStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (status != null) {
            return investigationRepository.findByStatus(status, pageable);
        }
        return investigationRepository.findAll(pageable);
    }

    public Investigation getInvestigationById(UUID id) {
        return investigationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Investigation not found with ID: " + id));
    }

    @Transactional
    public InvestigationNote addNote(UUID investigationId, String content, String authorEmail) {
        getInvestigationById(investigationId);
        InvestigationNote note = new InvestigationNote();
        note.setInvestigationId(investigationId);
        note.setContent(content);
        note.setAuthorEmail(authorEmail != null ? authorEmail : "ANALYST");
        return noteRepository.save(note);
    }

    public List<InvestigationNote> getNotes(UUID investigationId) {
        return noteRepository.findByInvestigationIdOrderByCreatedAtAsc(investigationId);
    }

    @Transactional
    public InvestigationHypothesis addHypothesis(UUID investigationId, String statement, String authorEmail) {
        getInvestigationById(investigationId);
        InvestigationHypothesis hypothesis = new InvestigationHypothesis();
        hypothesis.setInvestigationId(investigationId);
        hypothesis.setStatement(statement);
        hypothesis.setStatus(HypothesisStatus.PROPOSED);
        hypothesis.setCreatedBy(authorEmail != null ? authorEmail : "ANALYST");
        return hypothesisRepository.save(hypothesis);
    }

    public List<InvestigationHypothesis> getHypotheses(UUID investigationId) {
        return hypothesisRepository.findByInvestigationId(investigationId);
    }

    @Transactional
    public InvestigationHypothesis updateHypothesisStatus(UUID hypothesisId, HypothesisStatus status) {
        InvestigationHypothesis hypothesis = hypothesisRepository.findById(hypothesisId)
                .orElseThrow(() -> new IllegalArgumentException("Hypothesis not found with ID: " + hypothesisId));
        hypothesis.setStatus(status);
        return hypothesisRepository.save(hypothesis);
    }

    @Transactional
    public InvestigationEvidence addEvidence(UUID investigationId, String evidenceType, String sourceType, String sourceId, String description, OffsetDateTime observedAt, DetectionConfidence confidence) {
        getInvestigationById(investigationId);
        InvestigationEvidence evidence = new InvestigationEvidence();
        evidence.setInvestigationId(investigationId);
        evidence.setEvidenceType(evidenceType);
        evidence.setSourceType(sourceType);
        evidence.setSourceId(sourceId);
        evidence.setDescription(description);
        evidence.setObservedAt(observedAt != null ? observedAt : OffsetDateTime.now());
        evidence.setConfidence(confidence != null ? confidence : DetectionConfidence.HIGH);
        
        InvestigationEvidence saved = evidenceRepository.save(evidence);

        // Also add timeline event
        TimelineEvent te = new TimelineEvent();
        te.setInvestigationId(investigationId);
        te.setEventTime(saved.getObservedAt());
        te.setEventType(evidenceType);
        te.setTitle(description);
        te.setDescription("Evidence recorded from " + sourceType + " (ID: " + sourceId + ")");
        te.setSource(sourceType);
        te.setConfidence(saved.getConfidence());
        timelineEventRepository.save(te);

        // Rebuild attack chain
        attackChainService.rebuildAttackChain(investigationId);

        return saved;
    }

    public List<InvestigationEvidence> getEvidenceList(UUID investigationId) {
        return evidenceRepository.findByInvestigationId(investigationId);
    }

    @Transactional
    public HypothesisEvidence linkHypothesisEvidence(UUID hypothesisId, UUID evidenceId, HypothesisRelationship relationship) {
        HypothesisEvidenceKey key = new HypothesisEvidenceKey(hypothesisId, evidenceId);
        HypothesisEvidence link = new HypothesisEvidence(key, relationship != null ? relationship : HypothesisRelationship.SUPPORTING);
        return hypothesisEvidenceRepository.save(link);
    }

    @Transactional
    public Investigation updateStatus(UUID investigationId, InvestigationStatus status, InvestigationConclusion conclusion) {
        Investigation inv = getInvestigationById(investigationId);
        inv.setStatus(status);
        if (conclusion != null) {
            inv.setConclusion(conclusion);
        }
        if (status == InvestigationStatus.COMPLETED) {
            inv.setClosedAt(OffsetDateTime.now());
            // Sync status to incident
            SecurityIncident incident = incidentRepository.findById(inv.getIncidentId()).orElse(null);
            if (incident != null) {
                if (conclusion == InvestigationConclusion.FALSE_POSITIVE) {
                    incident.setStatus(com.globalshield.incident.IncidentStatus.FALSE_POSITIVE);
                } else {
                    incident.setStatus(com.globalshield.incident.IncidentStatus.RESOLVED);
                }
                incidentRepository.save(incident);
            }
        }
        return investigationRepository.save(inv);
    }

    public List<TimelineEvent> getTimeline(UUID investigationId) {
        return timelineEventRepository.findByInvestigationIdOrderByEventTimeAsc(investigationId);
    }

    public AttackChain getAttackChain(UUID investigationId) {
        return attackChainService.getOrCreateAttackChain(investigationId);
    }
}
