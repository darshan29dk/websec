package com.globalshield.posture.dto;

import com.globalshield.posture.entity.RegressionConfidence;
import com.globalshield.posture.entity.RegressionStatus;
import com.globalshield.posture.entity.RegressionType;

import java.time.Instant;

public record SecurityRegressionDto(
    String id,
    String uuid,
    String targetId,
    String previousAssessmentId,
    String currentAssessmentId,
    String findingFingerprint,
    String previousFindingId,
    String currentFindingId,
    String findingTitle,
    RegressionType regressionType,
    RegressionConfidence confidence,
    RegressionStatus status,
    String explanation,
    Instant detectedAt,
    Instant createdAt
) {}
