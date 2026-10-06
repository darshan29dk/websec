package com.aegis.assessment;

import com.aegis.assessment.dto.*;
import com.aegis.common.ApiResponse;
import com.aegis.common.IpUtil;
import com.aegis.common.PageResponse;
import com.aegis.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Assessment Management", description = "Assessment profile definitions and assessment lifecycle engine")
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final AssessmentProfileService profileService;

    @GetMapping("/assessment-profiles")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "List assessment profiles", description = "Return available security assessment profile definitions")
    public ResponseEntity<ApiResponse<List<AssessmentProfileResponse>>> getAssessmentProfiles() {
        List<AssessmentProfileResponse> profiles = profileService.getActiveProfiles();
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    @PostMapping("/assessments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Create assessment", description = "Create assessment record after validating target authorization")
    public ResponseEntity<ApiResponse<AssessmentResponse>> createAssessment(
            @Valid @RequestBody CreateAssessmentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        AssessmentResponse response = assessmentService.createAssessment(request, currentUser, ipAddress, userAgent);
        return new ResponseEntity<>(ApiResponse.success("Assessment queued successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/assessments/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Start assessment", description = "Start processing an authorized security assessment pipeline asynchronously")
    public ResponseEntity<ApiResponse<AssessmentResponse>> startAssessment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        AssessmentResponse response = assessmentService.startAssessment(id, currentUser, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Assessment started successfully", response));
    }

    @GetMapping("/assessments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "List assessments", description = "Return paginated assessment records")
    public ResponseEntity<ApiResponse<PageResponse<AssessmentResponse>>> getAssessments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID targetId,
            @RequestParam(required = false) AssessmentStatus status) {

        PageResponse<AssessmentResponse> response = assessmentService.getAssessments(page, size, targetId, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assessments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get assessment details", description = "Return assessment record details by ID")
    public ResponseEntity<ApiResponse<AssessmentResponse>> getAssessmentById(@PathVariable UUID id) {
        AssessmentResponse response = assessmentService.getAssessmentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assessments/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get assessment status", description = "Return assessment lifecycle status, current stage, and progress")
    public ResponseEntity<ApiResponse<AssessmentStatusResponse>> getAssessmentStatus(@PathVariable UUID id) {
        AssessmentStatusResponse response = assessmentService.getAssessmentStatus(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assessments/{id}/progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get assessment progress", description = "Return assessment progress percentage and current stage")
    public ResponseEntity<ApiResponse<AssessmentStatusResponse>> getAssessmentProgress(@PathVariable UUID id) {
        AssessmentStatusResponse response = assessmentService.getAssessmentStatus(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assessments/{id}/executions")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get tool executions", description = "Return paginated security tool execution records for an assessment")
    public ResponseEntity<ApiResponse<PageResponse<ToolExecutionResponse>>> getToolExecutions(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<ToolExecutionResponse> response = assessmentService.getToolExecutions(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assessments/{id}/assets")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get assessment assets", description = "Return paginated assets discovered during assessment")
    public ResponseEntity<ApiResponse<PageResponse<AssetResponse>>> getAssets(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<AssetResponse> response = assessmentService.getAssets(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assessments/{id}/endpoints")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get assessment endpoints", description = "Return paginated web endpoints observed during assessment")
    public ResponseEntity<ApiResponse<PageResponse<EndpointResponse>>> getEndpoints(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<EndpointResponse> response = assessmentService.getEndpoints(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/assessments/{id}/observations")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get assessment observations", description = "Return paginated raw tool observations for an assessment")
    public ResponseEntity<ApiResponse<PageResponse<ObservationResponse>>> getObservations(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<ObservationResponse> response = assessmentService.getObservations(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/assessments/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Cancel assessment", description = "Cancel a running or queued security assessment")
    public ResponseEntity<ApiResponse<AssessmentResponse>> cancelAssessment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        AssessmentResponse response = assessmentService.cancelAssessment(id, currentUser, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Assessment cancelled successfully", response));
    }

    @PostMapping("/assessments/{id}/retry-failed-stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Retry failed stage", description = "Retry a failed non-destructive stage of a partially completed assessment")
    public ResponseEntity<ApiResponse<AssessmentResponse>> retryFailedStage(
            @PathVariable UUID id,
            @RequestParam(required = false) AssessmentStage stage,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        AssessmentResponse response = assessmentService.retryFailedStage(id, stage, currentUser, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Assessment stage retry queued successfully", response));
    }
}
