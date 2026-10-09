package com.globalshield.defense.dto;

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
    private String remediationMode; // GUIDANCE_ONLY, REVIEWABLE_ASSISTED_PATCH, CONTROLLED_AUTOMATED
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private String reviewablePatchDiff;
    private String verificationCriteria;
    private String automatedActionType;
}
