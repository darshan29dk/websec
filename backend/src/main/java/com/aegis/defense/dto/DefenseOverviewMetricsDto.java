package com.aegis.defense.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DefenseOverviewMetricsDto {
    private long openRecommendations;
    private long criticalRemediations;
    private long highPriorityRemediations;
    private long awaitingReview;
    private long implemented;
    private long awaitingVerification;
}
