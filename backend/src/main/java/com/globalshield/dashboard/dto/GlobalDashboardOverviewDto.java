package com.globalshield.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalDashboardOverviewDto {

    // Target (Website) aggregates - strictly counting registered websites, not endpoints
    private long totalWebsites;
    private long criticalRiskWebsites;
    private long highRiskWebsites;
    private long mediumRiskWebsites;
    private long lowRiskWebsites;
    private long unassessedWebsites;

    // Discovered Endpoints across all websites
    private long totalDiscoveredEndpoints;

    // Unique open findings
    private long totalUniqueOpenFindings;
    private long criticalOpenFindings;
    private long highOpenFindings;
    private long mediumOpenFindings;
    private long lowOpenFindings;

    // Remediation & verification
    private long findingsResolved;
    private long verifiedFixes;

    // Assessments & Incidents
    @Builder.Default
    private Map<String, Long> assessmentsByStatus = new HashMap<>();

    @Builder.Default
    private Map<String, Long> incidentsByStatus = new HashMap<>();

    private boolean telemetryConfigured;
    private String telemetryStatusMessage;

    // Continuous Monitoring
    private long monitoringActiveCount;
    private double monitoringCoveragePercent;
    private String latestMonitoringStatus;

    // Posture
    private Integer overallPostureScore; // null if unassessed
    private String overallPostureStatus; // STRONG, WARNING, AT_RISK, NOT_ASSESSED
    private String riskCalculationMethodology;
}
