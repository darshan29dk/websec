package com.globalshield.posture.dto;

import com.globalshield.posture.entity.PostureRiskLevel;

import java.time.Instant;

public record PostureTrendPointDto(
    String snapshotId,
    String assessmentId,
    int score,
    PostureRiskLevel riskLevel,
    Instant timestamp,
    int criticalCount,
    int highCount,
    int mediumCount,
    int lowCount,
    int regressionCount
) {}
