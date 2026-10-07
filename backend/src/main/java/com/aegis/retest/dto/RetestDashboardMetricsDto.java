package com.aegis.retest.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RetestDashboardMetricsDto {
    private long totalRetests;
    private long openFindings;
    private long awaitingRetest;
    private long currentlyRetesting;
    private long fixedCount;
    private long partiallyFixedCount;
    private long notFixedCount;
    private long regressedCount;
    private long inconclusiveCount;
}
