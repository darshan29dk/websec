package com.globalshield.incident;

import com.globalshield.attackchain.AttackChain;
import com.globalshield.attackchain.AttackChainRepository;
import com.globalshield.event.SecurityEvent;
import com.globalshield.event.SecurityEventRepository;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.investigation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class IncidentService {

    private final SecurityIncidentRepository incidentRepository;
    private final SecurityEventRepository securityEventRepository;
    private final InvestigationRepository investigationRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final AttackChainRepository attackChainRepository;
    private final InvestigationEvidenceRepository investigationEvidenceRepository;
    private final SecurityFindingRepository securityFindingRepository;

    public IncidentService(SecurityIncidentRepository incidentRepository,
                           SecurityEventRepository securityEventRepository,
                           InvestigationRepository investigationRepository,
                           TimelineEventRepository timelineEventRepository,
                           AttackChainRepository attackChainRepository,
                           InvestigationEvidenceRepository investigationEvidenceRepository,
                           SecurityFindingRepository securityFindingRepository) {
        this.incidentRepository = incidentRepository;
        this.securityEventRepository = securityEventRepository;
        this.investigationRepository = investigationRepository;
        this.timelineEventRepository = timelineEventRepository;
        this.attackChainRepository = attackChainRepository;
        this.investigationEvidenceRepository = investigationEvidenceRepository;
        this.securityFindingRepository = securityFindingRepository;
    }

    public Page<SecurityIncident> getIncidents(int page, int size, UUID targetId, IncidentSeverity severity, IncidentStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "firstObservedAt"));
        return incidentRepository.findIncidentsFiltered(targetId, severity, status, pageable);
    }

    public SecurityIncident getIncidentById(UUID id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found with ID: " + id));
    }

    @Transactional
    public SecurityIncident updateStatus(UUID id, IncidentStatus status) {
        SecurityIncident incident = getIncidentById(id);
        incident.setStatus(status);

        // If status changed to INVESTIGATING, auto-ensure investigation workspace
        if (status == IncidentStatus.INVESTIGATING) {
            getOrCreateInvestigation(incident.getId(), "SYSTEM");
        }

        return incidentRepository.save(incident);
    }

    public List<SecurityEvent> getEventsForIncident(UUID incidentId) {
        SecurityIncident incident = getIncidentById(incidentId);
        return securityEventRepository.findByTargetIdAndEventTimeBetween(
                incident.getTargetId(),
                incident.getFirstObservedAt().minusMinutes(5),
                incident.getLastObservedAt().plusMinutes(5)
        );
    }

    public List<TimelineEvent> getTimelineForIncident(UUID incidentId) {
        Optional<Investigation> invOpt = investigationRepository.findByIncidentId(incidentId);
        if (invOpt.isPresent()) {
            return timelineEventRepository.findByInvestigationIdOrderByEventTimeAsc(invOpt.get().getId());
        }
        return List.of();
    }

    public Optional<AttackChain> getAttackChainForIncident(UUID incidentId) {
        Optional<Investigation> invOpt = investigationRepository.findByIncidentId(incidentId);
        if (invOpt.isPresent()) {
            return attackChainRepository.findByInvestigationId(invOpt.get().getId());
        }
        return Optional.empty();
    }

    public List<InvestigationEvidence> getEvidenceForIncident(UUID incidentId) {
        Optional<Investigation> invOpt = investigationRepository.findByIncidentId(incidentId);
        if (invOpt.isPresent()) {
            return investigationEvidenceRepository.findByInvestigationId(invOpt.get().getId());
        }
        return List.of();
    }

    public List<SecurityFinding> getRelatedFindingsForIncident(UUID incidentId) {
        SecurityIncident incident = getIncidentById(incidentId);
        return securityFindingRepository.findAll().stream()
                .filter(f -> f.getAsset() != null && f.getAsset().getAssetValue() != null && incident.getTitle().contains(f.getAsset().getAssetValue()))
                .toList();
    }

    @Transactional
    public Investigation getOrCreateInvestigation(UUID incidentId, String userEmail) {
        SecurityIncident incident = getIncidentById(incidentId);
        Optional<Investigation> existing = investigationRepository.findByIncidentId(incidentId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Investigation inv = new Investigation();
        inv.setIncidentId(incidentId);
        inv.setStatus(InvestigationStatus.IN_PROGRESS);
        inv.setPrimaryHypothesis("Observed events consistent with pattern: " + incident.getTitle());
        inv.setCreatedBy(userEmail != null ? userEmail : "ANALYST");
        
        Investigation saved = investigationRepository.save(inv);

        // Update incident status to INVESTIGATING if NEW or OPEN
        if (incident.getStatus() == IncidentStatus.NEW || incident.getStatus() == IncidentStatus.OPEN) {
            incident.setStatus(IncidentStatus.INVESTIGATING);
            incidentRepository.save(incident);
        }

        return saved;
    }
}
