package com.globalshield.correlation;

import com.globalshield.detection.DetectionEngine;
import com.globalshield.detection.DetectionMatch;
import com.globalshield.detection.DetectionRule;
import com.globalshield.detection.DetectionRuleRepository;
import com.globalshield.event.SecurityEvent;
import com.globalshield.incident.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class EventCorrelationService implements DetectionEngine.DetectionEventListener {

    private static final Logger log = LoggerFactory.getLogger(EventCorrelationService.class);

    private final SecurityIncidentRepository incidentRepository;
    private final DetectionRuleRepository ruleRepository;

    @Value("${aegis.investigation.correlation-window-seconds:300}")
    private long correlationWindowSeconds;

    public EventCorrelationService(SecurityIncidentRepository incidentRepository,
                                   DetectionRuleRepository ruleRepository) {
        this.incidentRepository = incidentRepository;
        this.ruleRepository = ruleRepository;
    }

    @Override
    @Transactional
    public void onDetectionMatch(DetectionMatch match, SecurityEvent securityEvent) {
        correlateMatch(match, securityEvent);
    }

    @Transactional
    public SecurityIncident correlateMatch(DetectionMatch match, SecurityEvent securityEvent) {
        String srcIp = securityEvent.getSourceIp() != null ? securityEvent.getSourceIp().trim() : "UNKNOWN_SRC";
        String path = securityEvent.getPath() != null ? securityEvent.getPath().trim() : "GLOBAL";
        String corrKey = String.format("%s:%s:%s:%s", match.getTargetId(), match.getRuleId(), srcIp, path);

        Optional<SecurityIncident> existingOpt = incidentRepository.findByCorrelationKey(corrKey);

        OffsetDateTime now = match.getMatchedAt() != null ? match.getMatchedAt() : OffsetDateTime.now();

        if (existingOpt.isPresent()) {
            SecurityIncident incident = existingOpt.get();
            if (incident.getStatus() != IncidentStatus.CLOSED && incident.getStatus() != IncidentStatus.RESOLVED) {
                long secondsDiff = java.time.Duration.between(incident.getLastObservedAt(), now).abs().getSeconds();
                if (secondsDiff <= correlationWindowSeconds) {
                    incident.setLastObservedAt(now);
                    incident.setDescription(incident.getDescription() + "\n- Additional detection event matched at " + now);
                    log.info("Correlated detection match to existing Incident ID: {}", incident.getId());
                    return incidentRepository.save(incident);
                }
            }
        }

        // Create new Security Incident
        Optional<DetectionRule> ruleOpt = ruleRepository.findById(match.getRuleId());
        String ruleName = ruleOpt.map(DetectionRule::getName).orElse("Security Detection");

        SecurityIncident newIncident = new SecurityIncident();
        newIncident.setTargetId(match.getTargetId());
        newIncident.setTitle("Security Incident: " + ruleName);
        newIncident.setDescription("Correlated security incident triggered by rule '" + ruleName + "' on endpoint " + path);
        newIncident.setSeverity(mapIncidentSeverity(match.getSeverity()));
        newIncident.setConfidence(mapIncidentConfidence(match.getConfidence()));
        newIncident.setStatus(IncidentStatus.NEW);
        newIncident.setCorrelationKey(corrKey);

        // Strict Source IP Evidence preservation
        newIncident.setSourceIp(securityEvent.getSourceIp());
        newIncident.setSourceIpConfidence(securityEvent.getSourceIpConfidence());

        newIncident.setFirstObservedAt(securityEvent.getEventTime());
        newIncident.setLastObservedAt(securityEvent.getEventTime());
        newIncident.setCreatedBy("DETECTION_ENGINE");

        SecurityIncident savedIncident = incidentRepository.save(newIncident);
        log.info("Created NEW Security Incident ID: {} for correlation key: {}", savedIncident.getId(), corrKey);
        return savedIncident;
    }

    private IncidentSeverity mapIncidentSeverity(com.globalshield.detection.DetectionSeverity sev) {
        if (sev == null) return IncidentSeverity.MEDIUM;
        switch (sev) {
            case CRITICAL: return IncidentSeverity.CRITICAL;
            case HIGH: return IncidentSeverity.HIGH;
            case MEDIUM: return IncidentSeverity.MEDIUM;
            case LOW: return IncidentSeverity.LOW;
            default: return IncidentSeverity.INFO;
        }
    }

    private IncidentConfidence mapIncidentConfidence(com.globalshield.detection.DetectionConfidence conf) {
        if (conf == null) return IncidentConfidence.MEDIUM;
        switch (conf) {
            case HIGH: return IncidentConfidence.HIGH;
            case MEDIUM: return IncidentConfidence.MEDIUM;
            default: return IncidentConfidence.LOW;
        }
    }
}
