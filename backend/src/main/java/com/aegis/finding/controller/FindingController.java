package com.aegis.finding.controller;

import com.aegis.common.ApiResponse;
import com.aegis.common.IpUtil;
import com.aegis.common.PageResponse;
import com.aegis.finding.dto.*;
import com.aegis.finding.entity.FindingConfidence;
import com.aegis.finding.entity.FindingSeverity;
import com.aegis.finding.entity.FindingStatus;
import com.aegis.finding.service.FindingService;
import com.aegis.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Vulnerability Finding Intelligence Engine", description = "Vulnerability findings, evidence provenance, status workflows, comments, and severity prioritization")
public class FindingController {

    private final FindingService findingService;

    @GetMapping("/findings")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "List findings", description = "Return paginated security findings with backend filtering by severity, status, confidence, source, and search")
    public ResponseEntity<ApiResponse<PageResponse<SecurityFindingResponse>>> getFindings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID assessmentId,
            @RequestParam(required = false) FindingSeverity severity,
            @RequestParam(required = false) FindingStatus status,
            @RequestParam(required = false) FindingConfidence confidence,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String search) {

        PageResponse<SecurityFindingResponse> response = findingService.getFindings(
                page, size, assessmentId, severity, status, confidence, source, search
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/findings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get finding detail", description = "Return complete finding record including evidence, references, correlations, and comments")
    public ResponseEntity<ApiResponse<FindingDetailResponse>> getFindingById(@PathVariable UUID id) {
        FindingDetailResponse response = findingService.getFindingById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/findings/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Update finding status", description = "Update finding status with validation transition policy (OPEN, CONFIRMED, FALSE_POSITIVE, ACCEPTED_RISK, RESOLVED, REOPENED)")
    public ResponseEntity<ApiResponse<SecurityFindingResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFindingStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        SecurityFindingResponse response = findingService.updateStatus(id, request, currentUser, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Finding status updated successfully", response));
    }

    @PostMapping("/findings/{id}/comments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Add finding comment", description = "Add analyst comment to a security finding")
    public ResponseEntity<ApiResponse<FindingCommentResponse>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateFindingCommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        FindingCommentResponse response = findingService.addComment(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Comment added successfully", response));
    }

    @GetMapping("/findings/{id}/evidence")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get finding evidence", description = "Return redacted evidence items associated with a security finding")
    public ResponseEntity<ApiResponse<List<FindingEvidenceResponse>>> getEvidence(@PathVariable UUID id) {
        FindingDetailResponse detail = findingService.getFindingById(id);
        return ResponseEntity.ok(ApiResponse.success(detail.getEvidence()));
    }

    @GetMapping("/findings/{id}/references")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get finding references", description = "Return CVE/CWE/OWASP references associated with a security finding")
    public ResponseEntity<ApiResponse<List<FindingReferenceResponse>>> getReferences(@PathVariable UUID id) {
        FindingDetailResponse detail = findingService.getFindingById(id);
        return ResponseEntity.ok(ApiResponse.success(detail.getReferences()));
    }

    @GetMapping("/findings/{id}/correlations")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get finding correlations", description = "Return cross-tool correlations associated with a security finding")
    public ResponseEntity<ApiResponse<List<FindingCorrelationResponse>>> getCorrelations(@PathVariable UUID id) {
        FindingDetailResponse detail = findingService.getFindingById(id);
        return ResponseEntity.ok(ApiResponse.success(detail.getCorrelations()));
    }

    @GetMapping("/assessments/{id}/findings")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get assessment findings", description = "Return paginated findings discovered in an assessment")
    public ResponseEntity<ApiResponse<PageResponse<SecurityFindingResponse>>> getAssessmentFindings(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) FindingSeverity severity,
            @RequestParam(required = false) FindingStatus status,
            @RequestParam(required = false) FindingConfidence confidence,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String search) {

        PageResponse<SecurityFindingResponse> response = findingService.getFindings(
                page, size, id, severity, status, confidence, source, search
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assessments/{id}/findings/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get assessment findings summary", description = "Return severity distribution counts (Critical, High, Medium, Low, Info) for an assessment")
    public ResponseEntity<ApiResponse<FindingSummaryResponse>> getAssessmentFindingsSummary(@PathVariable UUID id) {
        FindingSummaryResponse summary = findingService.getSummary(id);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
