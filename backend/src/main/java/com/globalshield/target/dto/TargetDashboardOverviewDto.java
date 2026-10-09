package com.globalshield.target.dto;

import com.globalshield.assessment.AssessmentResponse;
import com.globalshield.target.TargetResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetDashboardOverviewDto {

    private TargetResponse target;
    private TargetRiskEvaluationDto riskEvaluation;

    private long discoveredEndpointsCount;
    private long totalAssessmentsCount;
    private AssessmentResponse latestAssessment;

    private long uniqueOpenFindings;
    private long criticalOpenFindings;
    private long highOpenFindings;
    private long mediumOpenFindings;
    private long lowOpenFindings;
    private long resolvedFindings;

    private long verifiedFixes;
    private long activeIncidents;
    private long forensicCasesCount;
    private long fuzzingCampaignsCount;

    private boolean monitoringEnabled;
    private String monitoringFrequency;
    private String monitoringStatus;

    private Integer postureScore;
    private String postureRiskLevel;

    @Builder.Default
    private List<String> recentActivity = new ArrayList<>();
}
