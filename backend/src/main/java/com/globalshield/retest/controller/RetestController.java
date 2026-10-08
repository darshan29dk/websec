package com.globalshield.retest.controller;

import com.globalshield.retest.dto.*;
import com.globalshield.retest.service.RetestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class RetestController {

    private final RetestService retestService;

    public RetestController(RetestService retestService) {
        this.retestService = retestService;
    }

    @PostMapping("/findings/{findingId}/retests")
    public ResponseEntity<RetestResponseDto> createRetest(@PathVariable UUID findingId,
                                                           @RequestBody(required = false) CreateRetestRequestDto request,
                                                           Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "security_analyst";
        if (request == null) request = new CreateRetestRequestDto();
        return ResponseEntity.ok(retestService.createRetest(findingId, request, username));
    }

    @GetMapping("/findings/{findingId}/retests")
    public ResponseEntity<List<RetestResponseDto>> listRetestsForFinding(@PathVariable UUID findingId) {
        return ResponseEntity.ok(retestService.listRetestsForFinding(findingId));
    }

    @GetMapping("/retests")
    public ResponseEntity<List<RetestResponseDto>> listAllRetests(@RequestParam(required = false) UUID targetId) {
        return ResponseEntity.ok(retestService.listAllRetests(targetId));
    }

    @GetMapping("/retests/{id}")
    public ResponseEntity<RetestResponseDto> getRetestById(@PathVariable UUID id) {
        return retestService.getRetestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/retests/{id}/start")
    public ResponseEntity<RetestResponseDto> startRetest(@PathVariable UUID id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "security_analyst";
        return ResponseEntity.ok(retestService.startRetest(id, username));
    }

    @PostMapping("/retests/{id}/cancel")
    public ResponseEntity<RetestResponseDto> cancelRetest(@PathVariable UUID id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "security_analyst";
        return retestService.cancelRetest(id, username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/retests/{id}/status")
    public ResponseEntity<Map<String, String>> getRetestStatus(@PathVariable UUID id) {
        return retestService.getRetestById(id)
                .map(r -> ResponseEntity.ok(Map.of("id", r.getId(), "status", r.getStatus())))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/retests/{id}/checks")
    public ResponseEntity<List<RetestCheckDto>> getRetestChecks(@PathVariable UUID id) {
        return ResponseEntity.ok(retestService.getRetestChecks(id));
    }

    @GetMapping("/retests/{id}/evidence")
    public ResponseEntity<List<RetestEvidenceDto>> getRetestEvidence(@PathVariable UUID id) {
        return ResponseEntity.ok(retestService.getRetestEvidence(id));
    }

    @GetMapping("/retests/{id}/validation")
    public ResponseEntity<DefenseValidationDto> getRetestValidation(@PathVariable UUID id) {
        return retestService.getRetestValidation(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/findings/{findingId}/validation-history")
    public ResponseEntity<List<RemediationStatusHistoryDto>> getFindingValidationHistory(@PathVariable UUID findingId) {
        return ResponseEntity.ok(retestService.getFindingValidationHistory(findingId));
    }

    @GetMapping("/retests/dashboard")
    public ResponseEntity<RetestDashboardMetricsDto> getDashboardMetrics() {
        return ResponseEntity.ok(retestService.getDashboardMetrics());
    }
}
