package com.aegis.posture.service;

import com.aegis.posture.entity.*;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PostureDimensionCalculator {

    @Getter
    @Builder
    public static class DimensionCalculationResult {
        private PostureDimensionType dimension;
        private Integer score;
        private PostureStatus status;
        private int evidenceCount;
        private String explanation;
        private List<FactorDraft> factors;
    }

    @Getter
    @Builder
    public static class FactorDraft {
        private PostureDimensionType dimension;
        private String factorType;
        private String factorName;
        private int impact;
        private double weight;
        private String evidenceReference;
        private String explanation;
    }

    public List<DimensionCalculationResult> calculateAllDimensions(PostureEvidenceCollector.TargetPostureEvidence evidence) {
        List<DimensionCalculationResult> results = new ArrayList<>();
        results.add(calculateVulnerabilityRisk(evidence));
        results.add(calculateAttackSurfaceRisk(evidence));
        results.add(calculateConfigurationSecurity(evidence));
        results.add(calculateRemediationHealth(evidence));
        results.add(calculateDefenseValidation(evidence));
        results.add(calculateRegressionRisk(evidence));
        return results;
    }

    private DimensionCalculationResult calculateVulnerabilityRisk(PostureEvidenceCollector.TargetPostureEvidence evidence) {
        if (!evidence.isHasSufficientData()) {
            return insufficientResult(PostureDimensionType.VULNERABILITY_RISK, "Insufficient finding data to compute vulnerability risk.");
        }

        int base = 100;
        List<FactorDraft> factors = new ArrayList<>();
        int evidenceCount = (int) (evidence.getCriticalOpenCount() + evidence.getHighOpenCount() + evidence.getMediumOpenCount() + evidence.getLowOpenCount());

        if (evidence.getCriticalOpenCount() > 0) {
            int penalty = (int) (evidence.getCriticalOpenCount() * 25);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.VULNERABILITY_RISK)
                .factorType("UNRESOLVED_CRITICAL_FINDING")
                .factorName("Unresolved Critical Findings")
                .impact(-penalty)
                .explanation(evidence.getCriticalOpenCount() + " unresolved critical severity findings detected (-25 each).")
                .build());
        }

        if (evidence.getHighOpenCount() > 0) {
            int penalty = (int) (evidence.getHighOpenCount() * 12);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.VULNERABILITY_RISK)
                .factorType("UNRESOLVED_HIGH_FINDING")
                .factorName("Unresolved High Findings")
                .impact(-penalty)
                .explanation(evidence.getHighOpenCount() + " unresolved high severity findings detected (-12 each).")
                .build());
        }

        if (evidence.getMediumOpenCount() > 0) {
            int penalty = (int) (evidence.getMediumOpenCount() * 5);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.VULNERABILITY_RISK)
                .factorType("UNRESOLVED_MEDIUM_FINDING")
                .factorName("Unresolved Medium Findings")
                .impact(-penalty)
                .explanation(evidence.getMediumOpenCount() + " unresolved medium severity findings detected (-5 each).")
                .build());
        }

        if (evidence.getLowOpenCount() > 0) {
            int penalty = (int) (evidence.getLowOpenCount() * 2);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.VULNERABILITY_RISK)
                .factorType("UNRESOLVED_LOW_FINDING")
                .factorName("Unresolved Low Findings")
                .impact(-penalty)
                .explanation(evidence.getLowOpenCount() + " unresolved low severity findings detected (-2 each).")
                .build());
        }

        if (evidence.getFixedCount() > 0) {
            int bonus = (int) Math.min(15, evidence.getFixedCount() * 5);
            base += bonus;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.VULNERABILITY_RISK)
                .factorType("FIXED_FINDING")
                .factorName("Remediated Findings Bonus")
                .impact(bonus)
                .explanation(evidence.getFixedCount() + " findings successfully fixed (+5 each up to +15).")
                .build());
        }

        int finalScore = Math.max(0, Math.min(100, base));
        String explanation = "Vulnerability risk score is " + finalScore + "/100 derived from " + evidenceCount + " active vulnerability findings.";

        return DimensionCalculationResult.builder()
            .dimension(PostureDimensionType.VULNERABILITY_RISK)
            .score(finalScore)
            .status(PostureStatus.VALID)
            .evidenceCount(evidenceCount)
            .explanation(explanation)
            .factors(factors)
            .build();
    }

    private DimensionCalculationResult calculateAttackSurfaceRisk(PostureEvidenceCollector.TargetPostureEvidence evidence) {
        if (!evidence.isHasSufficientData()) {
            return insufficientResult(PostureDimensionType.ATTACK_SURFACE_RISK, "Insufficient asset data to compute attack surface risk.");
        }

        int base = 100;
        List<FactorDraft> factors = new ArrayList<>();
        int evidenceCount = (int) (evidence.getAssetCount() + evidence.getEndpointCount());

        if (evidence.getAssetCount() > 3) {
            int penalty = (int) Math.min(20, (evidence.getAssetCount() - 3) * 2);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.ATTACK_SURFACE_RISK)
                .factorType("EXPOSED_SERVICE")
                .factorName("Expanded Asset Exposure")
                .impact(-penalty)
                .explanation(evidence.getAssetCount() + " assets discovered (-2 per asset over 3).")
                .build());
        }

        if (evidence.getEndpointCount() > 10) {
            int penalty = (int) Math.min(20, (evidence.getEndpointCount() - 10));
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.ATTACK_SURFACE_RISK)
                .factorType("NEW_ENDPOINT")
                .factorName("Exposed Endpoint Volume")
                .impact(-penalty)
                .explanation(evidence.getEndpointCount() + " web endpoints exposed (-1 per endpoint over 10).")
                .build());
        }

        int finalScore = Math.max(0, Math.min(100, base));
        String explanation = "Attack surface risk score is " + finalScore + "/100 across " + evidence.getAssetCount() + " assets and " + evidence.getEndpointCount() + " endpoints.";

        return DimensionCalculationResult.builder()
            .dimension(PostureDimensionType.ATTACK_SURFACE_RISK)
            .score(finalScore)
            .status(PostureStatus.VALID)
            .evidenceCount(evidenceCount)
            .explanation(explanation)
            .factors(factors)
            .build();
    }

    private DimensionCalculationResult calculateConfigurationSecurity(PostureEvidenceCollector.TargetPostureEvidence evidence) {
        if (!evidence.isHasSufficientData()) {
            return insufficientResult(PostureDimensionType.CONFIGURATION_SECURITY, "Insufficient configuration evidence.");
        }

        int base = 100;
        List<FactorDraft> factors = new ArrayList<>();
        int evidenceCount = (int) (evidence.getMediumOpenCount() + evidence.getLowOpenCount());

        if (evidence.getMediumOpenCount() > 0) {
            int penalty = (int) Math.min(30, evidence.getMediumOpenCount() * 6);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.CONFIGURATION_SECURITY)
                .factorType("UNRESOLVED_MEDIUM_FINDING")
                .factorName("Security Header / Config Weakness")
                .impact(-penalty)
                .explanation(evidence.getMediumOpenCount() + " configuration issues detected (-6 each).")
                .build());
        }

        int finalScore = Math.max(0, Math.min(100, base));
        String explanation = "Configuration security score is " + finalScore + "/100 based on evaluated security headers and configuration settings.";

        return DimensionCalculationResult.builder()
            .dimension(PostureDimensionType.CONFIGURATION_SECURITY)
            .score(finalScore)
            .status(PostureStatus.VALID)
            .evidenceCount(evidenceCount)
            .explanation(explanation)
            .factors(factors)
            .build();
    }

    private DimensionCalculationResult calculateRemediationHealth(PostureEvidenceCollector.TargetPostureEvidence evidence) {
        if (!evidence.isHasSufficientData()) {
            return insufficientResult(PostureDimensionType.REMEDIATION_HEALTH, "Insufficient remediation data.");
        }

        int base = 60;
        List<FactorDraft> factors = new ArrayList<>();
        int evidenceCount = (int) (evidence.getFixedCount() + evidence.getPartiallyFixedCount() + evidence.getRetestCount());

        if (evidence.getFixedCount() > 0) {
            int bonus = (int) Math.min(30, evidence.getFixedCount() * 10);
            base += bonus;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.REMEDIATION_HEALTH)
                .factorType("FIXED_FINDING")
                .factorName("Verified Remediations")
                .impact(bonus)
                .explanation(evidence.getFixedCount() + " findings verified fixed (+10 each).")
                .build());
        }

        if (evidence.getPartiallyFixedCount() > 0) {
            int bonus = (int) Math.min(15, evidence.getPartiallyFixedCount() * 5);
            base += bonus;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.REMEDIATION_HEALTH)
                .factorType("PARTIAL_RETEST")
                .factorName("Partially Remediated Issues")
                .impact(bonus)
                .explanation(evidence.getPartiallyFixedCount() + " partially fixed findings (+5 each).")
                .build());
        }

        if (evidence.getReopenedCount() > 0) {
            int penalty = (int) (evidence.getReopenedCount() * 15);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.REMEDIATION_HEALTH)
                .factorType("REOPENED_FINDING")
                .factorName("Failed Remediation Re-detections")
                .impact(-penalty)
                .explanation(evidence.getReopenedCount() + " findings reopened after fix (-15 each).")
                .build());
        }

        int finalScore = Math.max(0, Math.min(100, base));
        String explanation = "Remediation health score is " + finalScore + "/100 based on verified fixes and remediation progress.";

        return DimensionCalculationResult.builder()
            .dimension(PostureDimensionType.REMEDIATION_HEALTH)
            .score(finalScore)
            .status(PostureStatus.VALID)
            .evidenceCount(evidenceCount)
            .explanation(explanation)
            .factors(factors)
            .build();
    }

    private DimensionCalculationResult calculateDefenseValidation(PostureEvidenceCollector.TargetPostureEvidence evidence) {
        if (!evidence.isHasSufficientData()) {
            return insufficientResult(PostureDimensionType.DEFENSE_VALIDATION, "Insufficient defense validation data.");
        }

        int base = 75;
        List<FactorDraft> factors = new ArrayList<>();
        int evidenceCount = (int) (evidence.getDefenseValidationFixedCount() + evidence.getDefenseValidationFailedCount());

        if (evidence.getDefenseValidationFixedCount() > 0) {
            int bonus = (int) Math.min(25, evidence.getDefenseValidationFixedCount() * 15);
            base += bonus;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.DEFENSE_VALIDATION)
                .factorType("DEFENSE_VALIDATION_PASSED")
                .factorName("Passed Defense Retests")
                .impact(bonus)
                .explanation(evidence.getDefenseValidationFixedCount() + " defense validations passed (+15 each).")
                .build());
        }

        if (evidence.getDefenseValidationFailedCount() > 0) {
            int penalty = (int) (evidence.getDefenseValidationFailedCount() * 15);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.DEFENSE_VALIDATION)
                .factorType("DEFENSE_VALIDATION_FAILED")
                .factorName("Failed Defense Retests")
                .impact(-penalty)
                .explanation(evidence.getDefenseValidationFailedCount() + " defense validations failed (-15 each).")
                .build());
        }

        int finalScore = Math.max(0, Math.min(100, base));
        String explanation = "Defense validation score is " + finalScore + "/100 derived from " + evidenceCount + " controlled retest validations.";

        return DimensionCalculationResult.builder()
            .dimension(PostureDimensionType.DEFENSE_VALIDATION)
            .score(finalScore)
            .status(PostureStatus.VALID)
            .evidenceCount(evidenceCount)
            .explanation(explanation)
            .factors(factors)
            .build();
    }

    private DimensionCalculationResult calculateRegressionRisk(PostureEvidenceCollector.TargetPostureEvidence evidence) {
        if (!evidence.isHasSufficientData()) {
            return insufficientResult(PostureDimensionType.REGRESSION_RISK, "Insufficient data for regression risk.");
        }

        int base = 100;
        List<FactorDraft> factors = new ArrayList<>();
        int evidenceCount = (int) (evidence.getConfirmedRegressionCount() + evidence.getReopenedCount());

        if (evidence.getConfirmedRegressionCount() > 0) {
            int penalty = (int) (evidence.getConfirmedRegressionCount() * 30);
            base -= penalty;
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.REGRESSION_RISK)
                .factorType("REGRESSION_DETECTED")
                .factorName("Confirmed Vulnerability Regressions")
                .impact(-penalty)
                .explanation(evidence.getConfirmedRegressionCount() + " confirmed regressions detected (-30 each).")
                .build());
        } else {
            factors.add(FactorDraft.builder()
                .dimension(PostureDimensionType.REGRESSION_RISK)
                .factorType("NO_REGRESSION")
                .factorName("Zero Active Regressions")
                .impact(0)
                .explanation("No active security regressions detected.")
                .build());
        }

        int finalScore = Math.max(0, Math.min(100, base));
        String explanation = "Regression risk score is " + finalScore + "/100 based on historical vulnerability re-appearance tracking.";

        return DimensionCalculationResult.builder()
            .dimension(PostureDimensionType.REGRESSION_RISK)
            .score(finalScore)
            .status(PostureStatus.VALID)
            .evidenceCount(evidenceCount)
            .explanation(explanation)
            .factors(factors)
            .build();
    }

    private DimensionCalculationResult insufficientResult(PostureDimensionType dim, String message) {
        return DimensionCalculationResult.builder()
            .dimension(dim)
            .score(null)
            .status(PostureStatus.INSUFFICIENT_DATA)
            .evidenceCount(0)
            .explanation(message)
            .factors(List.of())
            .build();
    }
}
