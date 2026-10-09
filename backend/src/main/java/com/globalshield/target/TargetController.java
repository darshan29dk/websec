package com.globalshield.target;

import com.globalshield.common.ApiResponse;
import com.globalshield.common.IpUtil;
import com.globalshield.common.PageResponse;
import com.globalshield.security.UserPrincipal;
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
@RequestMapping("/api/v1/targets")
@RequiredArgsConstructor
@Tag(name = "Authorized Targets", description = "Target registration, scope definition, and authorization management")
public class TargetController {

    private final TargetService targetService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Register target", description = "Create an authorized security target record")
    public ResponseEntity<ApiResponse<TargetResponse>> createTarget(
            @Valid @RequestBody TargetRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        TargetResponse response = targetService.createTarget(request, currentUser, ipAddress, userAgent);
        return new ResponseEntity<>(ApiResponse.success("Target registered successfully", response), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "List targets", description = "Return paginated targets with filtering and search")
    public ResponseEntity<ApiResponse<PageResponse<TargetResponse>>> getTargets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TargetStatus status,
            @RequestParam(required = false) String search) {

        PageResponse<TargetResponse> response = targetService.getTargets(page, size, status, search);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get target details", description = "Return target details by ID")
    public ResponseEntity<ApiResponse<TargetResponse>> getTargetById(@PathVariable UUID id) {
        TargetResponse response = targetService.getTargetById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Update target metadata", description = "Update name, primary URL, and description of a target")
    public ResponseEntity<ApiResponse<TargetResponse>> updateTarget(
            @PathVariable UUID id,
            @Valid @RequestBody TargetRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        TargetResponse response = targetService.updateTarget(id, request, currentUser, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Target updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Disable target", description = "Soft-delete target by setting status to DISABLED")
    public ResponseEntity<ApiResponse<TargetResponse>> disableTarget(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        TargetResponse response = targetService.disableTarget(id, currentUser, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Target disabled successfully", response));
    }

    @PostMapping("/{id}/authorization")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Create target authorization", description = "Create an explicit target authorization record")
    public ResponseEntity<ApiResponse<TargetAuthorizationResponse>> addAuthorization(
            @PathVariable UUID id,
            @Valid @RequestBody TargetAuthorizationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        TargetAuthorizationResponse response = targetService.addAuthorization(id, request, currentUser, ipAddress, userAgent);
        return new ResponseEntity<>(ApiResponse.success("Target authorization record created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/authorization")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get target authorizations", description = "Return authorization status and records for target")
    public ResponseEntity<ApiResponse<List<TargetAuthorizationResponse>>> getAuthorizations(@PathVariable UUID id) {
        List<TargetAuthorizationResponse> response = targetService.getAuthorizations(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/scope")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Create target scope entry", description = "Add a scope entry (DOMAIN, URL, IP, PATH) to a target")
    public ResponseEntity<ApiResponse<TargetScopeResponse>> addScope(
            @PathVariable UUID id,
            @Valid @RequestBody TargetScopeRequest request) {

        TargetScopeResponse response = targetService.addScope(id, request);
        return new ResponseEntity<>(ApiResponse.success("Target scope created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/scope")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get target scope entries", description = "Return scope entries for target")
    public ResponseEntity<ApiResponse<List<TargetScopeResponse>>> getScopes(@PathVariable UUID id) {
        List<TargetScopeResponse> response = targetService.getScopes(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
