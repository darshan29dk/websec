package com.aegis.attacksurface.controller;

import com.aegis.attacksurface.dto.*;
import com.aegis.attacksurface.entity.AssetType;
import com.aegis.attacksurface.service.AttackSurfaceService;
import com.aegis.common.ApiResponse;
import com.aegis.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessments")
@RequiredArgsConstructor
@Tag(name = "Attack Surface Engine", description = "Attack surface discovery, asset inventory, technology correlation, and relationship topology")
public class AttackSurfaceController {

    private final AttackSurfaceService attackSurfaceService;

    @GetMapping("/{id}/attack-surface")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get attack surface overview", description = "Return attack surface summary metrics for an assessment")
    public ResponseEntity<ApiResponse<AttackSurfaceSummaryResponse>> getAttackSurfaceOverview(@PathVariable UUID id) {
        AttackSurfaceSummaryResponse summary = attackSurfaceService.getSummary(id);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/{id}/attack-surface/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get attack surface summary", description = "Return detailed counts of hosts, IPs, ports, technologies, web apps, and endpoints")
    public ResponseEntity<ApiResponse<AttackSurfaceSummaryResponse>> getAttackSurfaceSummary(@PathVariable UUID id) {
        AttackSurfaceSummaryResponse summary = attackSurfaceService.getSummary(id);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/{id}/attack-surface/assets")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get attack surface assets", description = "Return paginated attack surface asset inventory filtered by type")
    public ResponseEntity<ApiResponse<PageResponse<AttackSurfaceAssetResponse>>> getAssets(
            @PathVariable UUID id,
            @RequestParam(required = false) AssetType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<AttackSurfaceAssetResponse> response = attackSurfaceService.getAssets(id, type, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/attack-surface/relationships")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get attack surface relationships", description = "Return paginated asset topology relationship graph edges")
    public ResponseEntity<ApiResponse<PageResponse<AttackSurfaceRelationshipResponse>>> getRelationships(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<AttackSurfaceRelationshipResponse> response = attackSurfaceService.getRelationships(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/attack-surface/technologies")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get technology inventory", description = "Return paginated correlated technologies detected during assessment")
    public ResponseEntity<ApiResponse<PageResponse<TechnologyResponse>>> getTechnologies(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<TechnologyResponse> response = attackSurfaceService.getTechnologies(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/attack-surface/endpoints")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get endpoint inventory", description = "Return paginated web and API endpoints discovered during assessment")
    public ResponseEntity<ApiResponse<PageResponse<WebEndpointResponse>>> getEndpoints(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<WebEndpointResponse> response = attackSurfaceService.getEndpoints(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/attack-surface/services")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get service inventory", description = "Return paginated exposed network ports and services")
    public ResponseEntity<ApiResponse<PageResponse<AttackSurfaceAssetResponse>>> getServices(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageResponse<AttackSurfaceAssetResponse> response = attackSurfaceService.getAssets(id, AssetType.PORT, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
