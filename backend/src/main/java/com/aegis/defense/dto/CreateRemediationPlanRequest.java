package com.aegis.defense.dto;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class CreateRemediationPlanRequest {
    private UUID findingId;
    private UUID recommendationId;
    private String title;
    private String description;
    private String priority;
    private String owner;
    private OffsetDateTime targetDate;
}
