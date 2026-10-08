package com.aegis.posture.dto;

import com.aegis.posture.entity.PostureDimensionType;
import com.aegis.posture.entity.PostureStatus;

import java.time.Instant;
import java.util.List;

public record SecurityPostureDimensionDto(
    String id,
    String uuid,
    String snapshotId,
    PostureDimensionType dimension,
    Integer score,
    PostureStatus status,
    int evidenceCount,
    String explanation,
    Instant createdAt,
    List<PostureScoreFactorDto> factors
) {}
