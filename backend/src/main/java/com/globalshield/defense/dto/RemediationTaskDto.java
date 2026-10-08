package com.globalshield.defense.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class RemediationTaskDto {
    private UUID id;
    private UUID uuid;
    private UUID planId;
    private String title;
    private String description;
    private String taskType;
    private Integer sequence;
    private String status;
    private String owner;
    private OffsetDateTime createdAt;
    private OffsetDateTime completedAt;
}
