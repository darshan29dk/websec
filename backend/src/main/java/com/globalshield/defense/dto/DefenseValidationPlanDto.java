package com.globalshield.defense.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DefenseValidationPlanDto {
    private UUID id;
    private UUID uuid;
    private UUID recommendationId;
    private String planTitle;
    private List<String> validationSteps;
    private String verificationBoundary;
}
