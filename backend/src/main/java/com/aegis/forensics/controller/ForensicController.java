package com.aegis.forensics.controller;

import com.aegis.common.ApiResponse;
import com.aegis.common.PageResponse;
import com.aegis.forensics.dto.*;
import com.aegis.forensics.enums.CaseStatus;
import com.aegis.forensics.service.ForensicService;
import com.aegis.security.UserPrincipal;
import com.aegis.user.User;
import com.aegis.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ForensicController {

    private final ForensicService forensicService;
    private final UserRepository userRepository;

    @PostMapping("/forensics/cases")
    public ResponseEntity<ApiResponse<ForensicCaseResponse>> createCase(
            @Valid @RequestBody CreateForensicCaseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = (principal != null) ? userRepository.findById(principal.getId()).orElse(null) : null;
        ForensicCaseResponse response = forensicService.createCase(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Forensic case created successfully", response));
    }

    @PostMapping("/incidents/{incidentId}/forensic-case")
    public ResponseEntity<ApiResponse<ForensicCaseResponse>> createCaseFromIncident(
            @PathVariable UUID incidentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = (principal != null) ? userRepository.findById(principal.getId()).orElse(null) : null;
        ForensicCaseResponse response = forensicService.createCaseFromIncident(incidentId, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Forensic case created from incident successfully", response));
    }

    @GetMapping("/forensics/cases")
    public ResponseEntity<ApiResponse<PageResponse<ForensicCaseResponse>>> getCases(
            @RequestParam(required = false) UUID targetId,
            @RequestParam(required = false) CaseStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ForensicCaseResponse> cases = forensicService.getCases(targetId, status,
                PageRequest.of(page, size, Sort.by("openedAt").descending()));
        return ResponseEntity.ok(ApiResponse.success("Forensic cases retrieved successfully", PageResponse.from(cases)));
    }

    @GetMapping("/forensics/cases/{id}")
    public ResponseEntity<ApiResponse<ForensicCaseResponse>> getCaseById(@PathVariable UUID id) {
        ForensicCaseResponse response = forensicService.getCaseById(id);
        return ResponseEntity.ok(ApiResponse.success("Forensic case retrieved successfully", response));
    }

    @PostMapping("/forensics/cases/{id}/close")
    public ResponseEntity<ApiResponse<ForensicCaseResponse>> closeCase(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "CLOSED") CaseStatus status) {
        ForensicCaseResponse response = forensicService.closeCase(id, status);
        return ResponseEntity.ok(ApiResponse.success("Forensic case closed successfully", response));
    }

    @PostMapping("/forensics/cases/{id}/evidence")
    public ResponseEntity<ApiResponse<EvidenceResponse>> addEvidence(
            @PathVariable UUID id,
            @Valid @RequestBody AddEvidenceRequest request) {
        EvidenceResponse response = forensicService.addEvidence(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Evidence added successfully", response));
    }

    @GetMapping("/forensics/cases/{id}/evidence")
    public ResponseEntity<ApiResponse<PageResponse<EvidenceResponse>>> getCaseEvidence(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<EvidenceResponse> evidence = forensicService.getCaseEvidence(id, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Case evidence retrieved successfully", PageResponse.from(evidence)));
    }

    @PostMapping("/forensics/evidence/{id}/verify")
    public ResponseEntity<ApiResponse<EvidenceVerificationResponse>> verifyEvidenceIntegrity(@PathVariable UUID id) {
        EvidenceVerificationResponse response = forensicService.verifyEvidenceIntegrity(id);
        return ResponseEntity.ok(ApiResponse.success("Evidence integrity verification completed", response));
    }

    @GetMapping("/forensics/cases/{id}/timeline")
    public ResponseEntity<ApiResponse<PageResponse<TimelineEventResponse>>> getCaseTimeline(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<TimelineEventResponse> timeline = forensicService.getCaseTimeline(id, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Case timeline retrieved successfully", PageResponse.from(timeline)));
    }

    @GetMapping("/forensics/cases/{id}/http-events")
    public ResponseEntity<ApiResponse<PageResponse<HttpForensicEventResponse>>> getHttpEvents(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<HttpForensicEventResponse> httpEvents = forensicService.getHttpEvents(id, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("HTTP forensic events retrieved successfully", PageResponse.from(httpEvents)));
    }

    @GetMapping("/forensics/cases/{id}/network-events")
    public ResponseEntity<ApiResponse<PageResponse<NetworkForensicEventResponse>>> getNetworkEvents(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<NetworkForensicEventResponse> networkEvents = forensicService.getNetworkEvents(id, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Network forensic events retrieved successfully", PageResponse.from(networkEvents)));
    }

    @GetMapping("/forensics/cases/{id}/attack-events")
    public ResponseEntity<ApiResponse<List<AttackEventResponse>>> getAttackEvents(@PathVariable UUID id) {
        List<AttackEventResponse> events = forensicService.getAttackEvents(id);
        return ResponseEntity.ok(ApiResponse.success("Attack events retrieved successfully", events));
    }

    @GetMapping("/forensics/cases/{id}/attack-chain")
    public ResponseEntity<ApiResponse<AttackChainResponse>> getAttackChain(@PathVariable UUID id) {
        AttackChainResponse response = forensicService.getAttackChain(id);
        return ResponseEntity.ok(ApiResponse.success("Forensic attack chain retrieved successfully", response));
    }

    @GetMapping("/forensics/cases/{id}/summary")
    public ResponseEntity<ApiResponse<ForensicSummaryResponse>> getForensicSummary(@PathVariable UUID id) {
        ForensicSummaryResponse response = forensicService.getForensicSummary(id);
        return ResponseEntity.ok(ApiResponse.success("Forensic summary retrieved successfully", response));
    }
}
