package com.globalshield.posture.service;

import com.globalshield.posture.entity.PostureDimensionType;
import com.globalshield.posture.entity.PostureRiskLevel;
import com.globalshield.posture.entity.PostureStatus;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class SecurityScoreCalculator {

    private static final Map<PostureDimensionType, Double> DIMENSION_WEIGHTS = Map.of(
        PostureDimensionType.VULNERABILITY_RISK, 0.35,
        PostureDimensionType.ATTACK_SURFACE_RISK, 0.15,
        PostureDimensionType.CONFIGURATION_SECURITY, 0.15,
        PostureDimensionType.REMEDIATION_HEALTH, 0.15,
        PostureDimensionType.DEFENSE_VALIDATION, 0.10,
        PostureDimensionType.REGRESSION_RISK, 0.10
    );

    @Getter
    @Builder
    public static class ScoreCalculationResult {
        private int overallScore;
        private PostureRiskLevel riskLevel;
        private PostureStatus scoreStatus;
        private List<PostureDimensionCalculator.FactorDraft> allFactors;
        private String explanation;
    }

    public ScoreCalculationResult calculateOverallScore(
        List<PostureDimensionCalculator.DimensionCalculationResult> dimensionResults,
        boolean hasSufficientData
    ) {
        if (!hasSufficientData) {
            return ScoreCalculationResult.builder()
                .overallScore(0)
                .riskLevel(PostureRiskLevel.INSUFFICIENT_DATA)
                .scoreStatus(PostureStatus.INSUFFICIENT_DATA)
                .allFactors(List.of())
                .explanation("Security posture cannot be computed because insufficient assessment data exists.")
                .build();
        }

        double weightedSum = 0;
        double totalWeight = 0;
        List<PostureDimensionCalculator.FactorDraft> allFactors = new ArrayList<>();

        for (var dimResult : dimensionResults) {
            if (dimResult.getFactors() != null) {
                allFactors.addAll(dimResult.getFactors());
            }

            if (dimResult.getStatus() == PostureStatus.VALID && dimResult.getScore() != null) {
                double weight = DIMENSION_WEIGHTS.getOrDefault(dimResult.getDimension(), 0.10);
                weightedSum += dimResult.getScore() * weight;
                totalWeight += weight;
            }
        }

        int finalScore = totalWeight > 0 ? (int) Math.round(weightedSum / totalWeight) : 100;
        finalScore = Math.max(0, Math.min(100, finalScore));

        PostureRiskLevel riskLevel = determineRiskLevel(finalScore);

        String explanation = String.format("Overall security posture score is %d/100 (%s) calculated deterministically from %d dimension factors.",
            finalScore, riskLevel.name(), allFactors.size());

        return ScoreCalculationResult.builder()
            .overallScore(finalScore)
            .riskLevel(riskLevel)
            .scoreStatus(PostureStatus.VALID)
            .allFactors(allFactors)
            .explanation(explanation)
            .build();
    }

    public PostureRiskLevel determineRiskLevel(int score) {
        if (score >= 90) return PostureRiskLevel.EXCELLENT;
        if (score >= 75) return PostureRiskLevel.GOOD;
        if (score >= 60) return PostureRiskLevel.MODERATE;
        if (score >= 40) return PostureRiskLevel.HIGH_RISK;
        return PostureRiskLevel.CRITICAL_RISK;
    }
}
