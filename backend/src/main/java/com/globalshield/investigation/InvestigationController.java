package com.globalshield.investigation;

import com.globalshield.attackchain.AttackChain;
import com.globalshield.attackchain.AttackChainNode;
import com.globalshield.attackchain.AttackChainEdge;
import com.globalshield.attackchain.AttackChainService;
import com.globalshield.common.ApiResponse;
import com.globalshield.common.PageResponse;
import com.globalshield.detection.DetectionConfidence;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/investigations")
public class InvestigationController {

    private final InvestigationService investigationService;
    private final AttackChainService attackChainService;

    public InvestigationController(InvestigationService investigationService,
                                  AttackChainService attackChainService) {
        this.investigationService = investigationService;
        this.attackChainService = attackChainService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Investigation>>> getInvestigations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) InvestigationStatus status
    ) {
        Page<Investigation> invPage = investigationService.getInvestigations(page, size, status);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(invPage)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInvestigationById(@PathVariable UUID id) {
        Investigation inv = investigationService.getInvestigationById(id);
        List<InvestigationNote> notes = investigationService.getNotes(id);
        List<InvestigationHypothesis> hypotheses = investigationService.getHypotheses(id);
        List<InvestigationEvidence> evidence = investigationService.getEvidenceList(id);
        List<TimelineEvent> timeline = investigationService.getTimeline(id);

        Map<String, Object> result = new HashMap<>();
        result.put("investigation", inv);
        result.put("notes", notes);
        result.put("hypotheses", hypotheses);
        result.put("evidence", evidence);
        result.put("timeline", timeline);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<InvestigationNote>> addNote(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails
    ) {
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Note content cannot be empty");
        }
        String authorEmail = userDetails != null ? userDetails.getUsername() : "ANALYST";
        InvestigationNote note = investigationService.addNote(id, content.trim(), authorEmail);
        return ResponseEntity.ok(ApiResponse.success("Investigation note added successfully", note));
    }

    @PostMapping("/{id}/hypotheses")
    public ResponseEntity<ApiResponse<InvestigationHypothesis>> addHypothesis(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails
    ) {
        String statement = body.get("statement");
        if (statement == null || statement.trim().isEmpty()) {
            throw new IllegalArgumentException("Hypothesis statement cannot be empty");
        }
        String authorEmail = userDetails != null ? userDetails.getUsername() : "ANALYST";
        InvestigationHypothesis hypothesis = investigationService.addHypothesis(id, statement.trim(), authorEmail);
        return ResponseEntity.ok(ApiResponse.success("Hypothesis proposed successfully", hypothesis));
    }

    @PostMapping("/hypotheses/{hypothesisId}/status")
    public ResponseEntity<ApiResponse<InvestigationHypothesis>> updateHypothesisStatus(
            @PathVariable UUID hypothesisId,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Status parameter is required");
        }
        HypothesisStatus status = HypothesisStatus.valueOf(statusStr.toUpperCase());
        InvestigationHypothesis updated = investigationService.updateHypothesisStatus(hypothesisId, status);
        return ResponseEntity.ok(ApiResponse.success("Hypothesis status updated to " + status, updated));
    }

    @PostMapping("/{id}/evidence")
    public ResponseEntity<ApiResponse<InvestigationEvidence>> addEvidence(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body
    ) {
        String evidenceType = (String) body.getOrDefault("evidenceType", "LOG_EVENT");
        String sourceType = (String) body.getOrDefault("sourceType", "MANUAL_ENTRY");
        String sourceId = (String) body.getOrDefault("sourceId", UUID.randomUUID().toString());
        String description = (String) body.getOrDefault("description", "Evidence artifact");
        
        DetectionConfidence confidence = DetectionConfidence.HIGH;
        if (body.containsKey("confidence")) {
            confidence = DetectionConfidence.valueOf(((String) body.get("confidence")).toUpperCase());
        }

        InvestigationEvidence ev = investigationService.addEvidence(id, evidenceType, sourceType, sourceId, description, OffsetDateTime.now(), confidence);
        return ResponseEntity.ok(ApiResponse.success("Evidence attached to investigation", ev));
    }

    @PostMapping("/hypotheses/{hypothesisId}/link-evidence")
    public ResponseEntity<ApiResponse<HypothesisEvidence>> linkEvidence(
            @PathVariable UUID hypothesisId,
            @RequestBody Map<String, String> body
    ) {
        String evidenceIdStr = body.get("evidenceId");
        if (evidenceIdStr == null) {
            throw new IllegalArgumentException("evidenceId is required");
        }
        UUID evidenceId = UUID.fromString(evidenceIdStr);
        String relStr = body.getOrDefault("relationship", "SUPPORTING");
        HypothesisRelationship rel = HypothesisRelationship.valueOf(relStr.toUpperCase());

        HypothesisEvidence link = investigationService.linkHypothesisEvidence(hypothesisId, evidenceId, rel);
        return ResponseEntity.ok(ApiResponse.success("Evidence linked to hypothesis", link));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Investigation>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Status parameter is required");
        }
        InvestigationStatus status = InvestigationStatus.valueOf(statusStr.toUpperCase());

        InvestigationConclusion conclusion = null;
        if (body.containsKey("conclusion") && body.get("conclusion") != null) {
            conclusion = InvestigationConclusion.valueOf(body.get("conclusion").toUpperCase());
        }

        Investigation updated = investigationService.updateStatus(id, status, conclusion);
        return ResponseEntity.ok(ApiResponse.success("Investigation status updated", updated));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<TimelineEvent>>> getTimeline(@PathVariable UUID id) {
        List<TimelineEvent> timeline = investigationService.getTimeline(id);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    @GetMapping("/{id}/attack-chain")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAttackChain(@PathVariable UUID id) {
        AttackChain chain = investigationService.getAttackChain(id);
        List<AttackChainNode> nodes = attackChainService.getNodes(chain.getId());
        List<AttackChainEdge> edges = attackChainService.getEdges(chain.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("chain", chain);
        result.put("nodes", nodes);
        result.put("edges", edges);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
