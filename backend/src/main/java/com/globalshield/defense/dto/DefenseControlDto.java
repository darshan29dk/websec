package com.globalshield.defense.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class DefenseControlDto {
    private UUID id;
    private String controlCode;
    private String name;
    private String category;
    private String description;
    private String implementationGuidance;
    private String validationGuidance;
    private OffsetDateTime createdAt;
}
