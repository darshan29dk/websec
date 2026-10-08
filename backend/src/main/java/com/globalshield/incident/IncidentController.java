package com.globalshield.incident;

import com.globalshield.attackchain.AttackChain;
import com.globalshield.common.ApiResponse;
import com.globalshield.common.PageResponse;
import com.globalshield.event.SecurityEvent;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.investigation.Investigation;
import com.globalshield.investigation.InvestigationEvidence;
import com.globalshield.investigation.TimelineEvent;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SecurityIncident>>> getIncidents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID targetId,
            @RequestParam(required = false) IncidentSeverity severity,
            @RequestParam(required = false) IncidentStatus status
    ) {
        Page<SecurityIncident> incidentPage = incidentService.getIncidents(page, size, targetId, severity, status);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(incidentPage)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SecurityIncident>> getIncidentById(@PathVariable UUID id) {
        SecurityIncident incident = incidentService.getIncidentById(id);
        return ResponseEntity.ok(ApiResponse.success(incident));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SecurityIncident>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Status parameter is required");
        }
        IncidentStatus status = IncidentStatus.valueOf(statusStr.toUpperCase());
        SecurityIncident updated = incidentService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Incident status updated to " + status, updated));
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<ApiResponse<List<SecurityEvent>>> getEventsForIncident(@PathVariable UUID id) {
        List<SecurityEvent> events = incidentService.getEventsForIncident(id);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<TimelineEvent>>> getTimelineForIncident(@PathVariable UUID id) {
        List<TimelineEvent> timeline = incidentService.getTimelineForIncident(id);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    @GetMapping("/{id}/attack-chain")
    public ResponseEntity<ApiResponse<AttackChain>> getAttackChainForIncident(@PathVariable UUID id) {
        Optional<AttackChain> chain = incidentService.getAttackChainForIncident(id);
        return ResponseEntity.ok(ApiResponse.success(chain.orElse(null)));
    }

    @GetMapping("/{id}/evidence")
    public ResponseEntity<ApiResponse<List<InvestigationEvidence>>> getEvidenceForIncident(@PathVariable UUID id) {
        List<InvestigationEvidence> evidence = incidentService.getEvidenceForIncident(id);
        return ResponseEntity.ok(ApiResponse.success(evidence));
    }

    @GetMapping("/{id}/related-findings")
    public ResponseEntity<ApiResponse<List<SecurityFinding>>> getRelatedFindingsForIncident(@PathVariable UUID id) {
        List<SecurityFinding> findings = incidentService.getRelatedFindingsForIncident(id);
        return ResponseEntity.ok(ApiResponse.success(findings));
    }

    @PostMapping("/{id}/investigation")
    public ResponseEntity<ApiResponse<Investigation>> createOrGetInvestigation(
            @PathVariable UUID id,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails
    ) {
        String userEmail = userDetails != null ? userDetails.getUsername() : "ANALYST";
        Investigation inv = incidentService.getOrCreateInvestigation(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Investigation workspace initialized", inv));
    }
}
