package com.aegis.posture.dto;

import com.aegis.posture.entity.PostureDimensionType;

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
