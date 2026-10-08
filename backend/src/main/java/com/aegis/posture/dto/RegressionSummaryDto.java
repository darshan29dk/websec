package com.aegis.posture.dto;

import java.util.List;

public record RegressionSummaryDto(
    String targetId,
    long totalRegressions,
    long confirmedRegressions,
    long potentialRegressions,
    long resolvedRegressions,
    double regressionRate, // reopened / previously fixed or -1 if N/A
    List<SecurityRegressionDto> recentRegressions
) {}
