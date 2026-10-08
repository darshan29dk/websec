package com.aegis.posture.dto;

import java.util.List;

public record AssessmentComparisonDto(
    String targetId,
    String previousAssessmentId,
    String currentAssessmentId,
    Integer previousScore,
    Integer currentScore,
    Integer scoreDelta,
    List<FindingSummaryItem> newFindings,
    List<FindingSummaryItem> fixedFindings,
    List<FindingSummaryItem> unchangedFindings,
    List<FindingSummaryItem> reopenedFindings,
    List<String> newExposures,
    List<String> removedExposures,
    List<String> changedTechnologies,
    List<String> retestChanges,
    List<String> defenseValidationChanges,
    String summaryExplanation
) {
    public record FindingSummaryItem(
        String findingId,
        String fingerprint,
        String title,
        String severity,
        String status,
        String endpoint
    ) {}
}
