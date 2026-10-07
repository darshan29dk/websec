package com.aegis.defense.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RemediationPlanDto {
    private UUID id;
    private UUID uuid;
    private UUID findingId;
    private String findingTitle;
    private UUID recommendationId;
    private String title;
    private String description;
    private String priority;
    private String owner;
    private OffsetDateTime targetDate;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<RemediationTaskDto> tasks;
}
