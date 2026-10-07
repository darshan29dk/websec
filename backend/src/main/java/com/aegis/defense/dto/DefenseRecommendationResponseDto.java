package com.aegis.defense.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DefenseRecommendationResponseDto {
    private UUID id;
    private UUID uuid;
    private UUID findingId;
    private String findingTitle;
    private String findingSeverity;
    private UUID investigationId;
    private String title;
    private String summary;
    private String rootCause;
    private String rootCauseExplanation;
    private String recommendationType;
    private String priority;
    private String priorityReasons;
    private Double confidence;
    private String confidenceBasis;
    private String status;
    private String implementationGuidance;
    private String compensatingControls;
    private String implementationRisks;
    private String createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    private List<DefenseControlDto> primaryControls;
    private List<DefenseControlDto> secondaryControls;
    private List<DefenseControlDto> compensatingControlsList;
    private List<DefenseEvidenceDto> supportingEvidence;
    private DefenseValidationPlanDto validationPlan;
}
