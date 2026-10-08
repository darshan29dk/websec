package com.aegis.posture.dto;

import com.aegis.posture.entity.PostureRiskLevel;
import com.aegis.posture.entity.PostureStatus;

import java.time.Instant;
import java.util.List;

public record SecurityPostureSnapshotDto(
    String id,
    String uuid,
    String targetId,
    String assessmentId,
    int overallScore,
    PostureRiskLevel riskLevel,
    PostureStatus scoreStatus,
    Integer previousScore,
    Integer scoreDelta,
    String scoreVersion,
    Instant calculatedAt,
    Instant createdAt,
    List<SecurityPostureDimensionDto> dimensions,
    List<PostureScoreFactorDto> factors
) {}
