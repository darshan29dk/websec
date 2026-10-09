package com.globalshield.dashboard.controller;

import com.globalshield.common.ApiResponse;
import com.globalshield.dashboard.dto.GlobalDashboardChartsDto;
import com.globalshield.dashboard.dto.GlobalDashboardOverviewDto;
import com.globalshield.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Global Security Dashboard", description = "Aggregated security intelligence across all authorized websites")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get global dashboard overview", description = "Return real platform-wide security aggregates, target counts, risk distribution, and posture")
    public ResponseEntity<ApiResponse<GlobalDashboardOverviewDto>> getGlobalOverview() {
        GlobalDashboardOverviewDto overview = dashboardService.getGlobalOverview();
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/charts")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get global dashboard charts data", description = "Return verified data sets for website risk distribution, findings, timelines, and retest outcomes")
    public ResponseEntity<ApiResponse<GlobalDashboardChartsDto>> getGlobalCharts() {
        GlobalDashboardChartsDto charts = dashboardService.getGlobalCharts();
        return ResponseEntity.ok(ApiResponse.success(charts));
    }
}
