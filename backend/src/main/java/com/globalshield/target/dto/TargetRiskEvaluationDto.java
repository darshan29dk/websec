package com.globalshield.target.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetRiskEvaluationDto {
    private String riskCategory; // CRITICAL, HIGH, MEDIUM, LOW, NOT_ASSESSED
    private Integer riskScore; // 0 to 100, null if NOT_ASSESSED
    private boolean criticalOverrideApplied;
    @Builder.Default
    private List<String> contributingFactors = new ArrayList<>();
    private long openCriticalCount;
    private long openHighCount;
    private long openMediumCount;
    private long openLowCount;
    private long totalOpenCount;
}
