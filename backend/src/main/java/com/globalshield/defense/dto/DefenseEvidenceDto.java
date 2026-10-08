package com.globalshield.defense.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class DefenseEvidenceDto {
    private UUID id;
    private UUID uuid;
    private String evidenceType;
    private String sourceType;
    private String sourceId;
    private String description;
    private Double confidence;
    private OffsetDateTime createdAt;
}
