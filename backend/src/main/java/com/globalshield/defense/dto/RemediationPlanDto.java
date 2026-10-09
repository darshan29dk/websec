package com.globalshield.defense.dto;

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
    private String remediationMode;
    private String riskLevel;
    private String approvalStatus;
    private String approvedBy;
    private OffsetDateTime approvedAt;
    private String rejectionReason;
    private String reviewablePatchDiff;
    private String verificationCriteria;
    private String automatedActionType;
    private boolean automatedExecutable;
    private String executionStatus;
    private OffsetDateTime executedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<RemediationTaskDto> tasks;
}
