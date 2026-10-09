package com.globalshield.fuzzing.controller;

import com.globalshield.common.ApiResponse;
import com.globalshield.fuzzing.dto.*;
import com.globalshield.fuzzing.entity.TestResultClassification;
import com.globalshield.fuzzing.service.FuzzingCampaignService;
import com.globalshield.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/fuzzing")
@RequiredArgsConstructor
@Tag(name = "Web Application Fuzzing", description = "Autonomous web application security testing, parameter fuzzing, and multi-step sequence evaluation")
public class FuzzingController {

    private final FuzzingCampaignService campaignService;

    @PostMapping("/campaigns")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Create a new fuzzing campaign", description = "Generates bounded test cases for authorized target and initializes coverage")
    public ResponseEntity<ApiResponse<FuzzingCampaignResponse>> createCampaign(
            @Valid @RequestBody CreateFuzzingCampaignRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        UUID userId = currentUser != null ? currentUser.getId() : null;
        String email = currentUser != null ? currentUser.getEmail() : "system";
        FuzzingCampaignResponse response = campaignService.createCampaign(request, userId, email);
        return new ResponseEntity<>(ApiResponse.success("Fuzzing campaign created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/campaigns")
    @Operation(summary = "List fuzzing campaigns", description = "Returns campaigns, optionally filtered by target ID")
    public ResponseEntity<ApiResponse<List<FuzzingCampaignResponse>>> getCampaigns(
            @RequestParam(required = false) UUID targetId
    ) {
        List<FuzzingCampaignResponse> list = targetId != null
                ? campaignService.getCampaignsByTarget(targetId)
                : campaignService.getAllCampaigns();
        return ResponseEntity.ok(ApiResponse.success("Retrieved campaigns", list));
    }

    @GetMapping("/campaigns/{id}")
    @Operation(summary = "Get campaign details", description = "Returns campaign metadata, progress, and finding counts")
    public ResponseEntity<ApiResponse<FuzzingCampaignResponse>> getCampaignById(@PathVariable UUID id) {
        FuzzingCampaignResponse response = campaignService.getCampaignById(id);
        return ResponseEntity.ok(ApiResponse.success("Retrieved campaign", response));
    }

    @PostMapping("/campaigns/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Start campaign execution", description = "Begins asynchronous bounded execution of fuzzing test cases")
    public ResponseEntity<ApiResponse<Void>> startCampaign(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        UUID userId = currentUser != null ? currentUser.getId() : null;
        String email = currentUser != null ? currentUser.getEmail() : "system";
        campaignService.startCampaignAsync(id, userId, email);
        return ResponseEntity.ok(ApiResponse.success("Campaign execution initiated", null));
    }

    @PostMapping("/campaigns/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Cancel campaign execution", description = "Halts execution and marks remaining pending test cases as cancelled")
    public ResponseEntity<ApiResponse<FuzzingCampaignResponse>> cancelCampaign(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        UUID userId = currentUser != null ? currentUser.getId() : null;
        String email = currentUser != null ? currentUser.getEmail() : "system";
        FuzzingCampaignResponse response = campaignService.cancelCampaign(id, userId, email);
        return ResponseEntity.ok(ApiResponse.success("Campaign cancelled", response));
    }

    @GetMapping("/campaigns/{id}/test-cases")
    @Operation(summary = "List campaign test cases", description = "Paged retrieval of generated test cases and payload definitions")
    public ResponseEntity<ApiResponse<Page<FuzzingTestCaseResponse>>> getTestCases(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("executionOrder").ascending());
        Page<FuzzingTestCaseResponse> testCases = campaignService.getTestCasesPaged(id, pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Retrieved test cases", testCases));
    }

    @GetMapping("/campaigns/{id}/executions")
    @Operation(summary = "List execution records", description = "Paged retrieval of executed test cases, responses, diff summaries, and finding classifications")
    public ResponseEntity<ApiResponse<Page<FuzzingExecutionRecordResponse>>> getExecutionRecords(
            @PathVariable UUID id,
            @RequestParam(required = false) TestResultClassification classification,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("executedAt").descending());
        Page<FuzzingExecutionRecordResponse> executions = campaignService.getExecutionRecordsPaged(id, classification, pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Retrieved execution records", executions));
    }

    @GetMapping("/campaigns/{id}/coverage")
    @Operation(summary = "Get OWASP Top 10 coverage matrix", description = "Returns versioned OWASP Top 10 coverage status and limitations")
    public ResponseEntity<ApiResponse<List<FuzzingCoverageResponse>>> getCoverage(@PathVariable UUID id) {
        List<FuzzingCoverageResponse> coverage = campaignService.getCoverage(id);
        return ResponseEntity.ok(ApiResponse.success("Retrieved coverage matrix", coverage));
    }

    @PostMapping("/reproduce")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Reproduce test case safely", description = "Re-executes an isolated test case with sanitized request/response inspection")
    public ResponseEntity<ApiResponse<ReproduceTestCaseResponse>> reproduceTestCase(
            @Valid @RequestBody ReproduceTestCaseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        UUID userId = currentUser != null ? currentUser.getId() : null;
        String email = currentUser != null ? currentUser.getEmail() : "system";
        ReproduceTestCaseResponse response = campaignService.reproduceTestCase(request, userId, email);
        return ResponseEntity.ok(ApiResponse.success("Test case reproduced", response));
    }

    @PostMapping("/link-finding")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Link finding to remediation or investigation", description = "Creates a remediation plan or links finding evidence to an ongoing investigation")
    public ResponseEntity<ApiResponse<Void>> linkFinding(
            @Valid @RequestBody LinkFindingRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        UUID userId = currentUser != null ? currentUser.getId() : null;
        String email = currentUser != null ? currentUser.getEmail() : "system";
        campaignService.linkFindingToRemediationOrInvestigation(request, userId, email);
        return ResponseEntity.ok(ApiResponse.success("Finding linked successfully", null));
    }
}
