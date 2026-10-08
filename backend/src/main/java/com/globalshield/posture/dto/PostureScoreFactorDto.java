package com.globalshield.posture.dto;

import com.globalshield.posture.entity.PostureDimensionType;

import java.time.Instant;

public record PostureScoreFactorDto(
    String id,
    String uuid,
    String snapshotId,
    PostureDimensionType dimension,
    String factorType,
    String factorName,
    int impact,
    double weight,
    String evidenceReference,
    String explanation,
    Instant createdAt
) {}
