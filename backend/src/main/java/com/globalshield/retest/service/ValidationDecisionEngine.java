package com.globalshield.retest.service;

import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.retest.entity.*;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ValidationDecisionEngine {

    public static class DecisionOutput {
        private final ValidationStatus status;
        private final ValidationConfidence confidence;
        private final String summary;
        private final List<ResultItem> results;

        public DecisionOutput(ValidationStatus status, ValidationConfidence confidence, String summary, List<ResultItem> results) {
            this.status = status;
            this.confidence = confidence;
            this.summary = summary;
            this.results = results != null ? results : new ArrayList<>();
        }

        public ValidationStatus getStatus() { return status; }
        public ValidationConfidence getConfidence() { return confidence; }
        public String getSummary() { return summary; }
        public List<ResultItem> getResults() { return results; }
    }

    public static class ResultItem {
        private final RetestCheck check;
        private final ValidationResultType resultType;
        private final String expectedValue;
        private final String observedValue;
        private final String comparisonResult;
        private final ValidationConfidence confidence;
        private final String evidenceReference;

        public ResultItem(RetestCheck check, ValidationResultType resultType, String expectedValue, String observedValue, String comparisonResult, ValidationConfidence confidence, String evidenceReference) {
            this.check = check;
            this.resultType = resultType;
            this.expectedValue = expectedValue;
            this.observedValue = observedValue;
            this.comparisonResult = comparisonResult;
            this.confidence = confidence;
            this.evidenceReference = evidenceReference;
        }

        public RetestCheck getCheck() { return check; }
        public ValidationResultType getResultType() { return resultType; }
        public String getExpectedValue() { return expectedValue; }
        public String getObservedValue() { return observedValue; }
        public String getComparisonResult() { return comparisonResult; }
        public ValidationConfidence getConfidence() { return confidence; }
        public String getEvidenceReference() { return evidenceReference; }
    }

    public DecisionOutput evaluate(SecurityFinding finding,
                                   String beforeEvidenceData,
                                   String afterEvidenceData,
                                   List<RetestCheck> checks,
                                   List<DefenseValidation> previousValidations) {

        List<ResultItem> resultItems = new ArrayList<>();
        boolean previouslyFixed = previousValidations != null && previousValidations.stream()
                .anyMatch(v -> v.getValidationStatus() == ValidationStatus.FIXED);

        if (checks == null || checks.isEmpty()) {
            return new DecisionOutput(
                    ValidationStatus.INCONCLUSIVE,
                    ValidationConfidence.LOW,
                    "Validation inconclusive: No retest checks were executed.",
                    resultItems
            );
        }

        boolean hasErrorOrUnavailable = checks.stream()
                .anyMatch(c -> c.getStatus() == RetestCheckStatus.ERROR || c.getStatus() == RetestCheckStatus.NOT_AVAILABLE);

        if (hasErrorOrUnavailable || afterEvidenceData == null || afterEvidenceData.isBlank() || afterEvidenceData.contains("ERROR:") || afterEvidenceData.contains("UNAVAILABLE")) {
            return new DecisionOutput(
                    ValidationStatus.INCONCLUSIVE,
                    ValidationConfidence.LOW,
                    "Validation inconclusive due to network error, tool unavailability, or incomplete evidence.",
                    resultItems
            );
        }

        int passedCount = 0;
        int failedCount = 0;
        int totalValidatable = 0;

        for (RetestCheck check : checks) {
            if (check.getStatus() == RetestCheckStatus.SKIPPED) continue;
            totalValidatable++;

            String expected = check.getExpectedCondition() != null ? check.getExpectedCondition() : "Remediated Condition";
            String observed = extractObservedValue(afterEvidenceData, check);
            boolean checkPassed = evaluateCheckPassed(finding, check, beforeEvidenceData, afterEvidenceData);

            ValidationResultType resType;
            String compResult;
            ValidationConfidence itemConfidence = ValidationConfidence.HIGH;

            if (checkPassed) {
                passedCount++;
                resType = ValidationResultType.EXPECTED;
                compResult = "Condition satisfies security criteria: " + expected;
            } else {
                failedCount++;
                resType = ValidationResultType.UNEXPECTED;
                compResult = "Condition violates expected criteria. Observed: " + observed;
            }

            resultItems.add(new ResultItem(check, resType, expected, observed, compResult, itemConfidence, "EVID-" + check.getUuid().substring(0, 8)));
        }

        if (totalValidatable == 0) {
            return new DecisionOutput(
                    ValidationStatus.INCONCLUSIVE,
                    ValidationConfidence.LOW,
                    "Validation inconclusive: All checks were skipped.",
                    resultItems
            );
        }

        ValidationStatus finalStatus;
        ValidationConfidence finalConfidence = ValidationConfidence.HIGH;
        String summary;

        if (passedCount == totalValidatable) {
            finalStatus = ValidationStatus.FIXED;
            summary = "Remediation verified: All " + totalValidatable + " controlled retest checks satisfied expected security conditions.";
        } else if (failedCount == totalValidatable) {
            if (previouslyFixed) {
                finalStatus = ValidationStatus.REGRESSED;
                summary = "REGRESSION DETECTED: Finding previously validated as FIXED has become vulnerable again during retest.";
            } else {
                finalStatus = ValidationStatus.NOT_FIXED;
                summary = "Remediation incomplete: Original security weakness remains observable during retest.";
            }
        } else if (passedCount > 0 && failedCount > 0) {
            finalStatus = ValidationStatus.PARTIALLY_FIXED;
            summary = "Partial remediation: " + passedCount + " of " + totalValidatable + " security conditions resolved; remaining weaknesses require attention.";
            finalConfidence = ValidationConfidence.MEDIUM;
        } else {
            finalStatus = ValidationStatus.INCONCLUSIVE;
            finalConfidence = ValidationConfidence.LOW;
            summary = "Validation inconclusive due to mixed or incomplete evidence.";
        }

        return new DecisionOutput(finalStatus, finalConfidence, summary, resultItems);
    }

    private boolean evaluateCheckPassed(SecurityFinding finding, RetestCheck check, String beforeData, String afterData) {
        if (check.getStatus() == RetestCheckStatus.PASSED) return true;
        if (check.getStatus() == RetestCheckStatus.FAILED) return false;

        String checkTypeStr = check.getCheckType() != null ? check.getCheckType().name() : "";
        String expected = check.getExpectedCondition() != null ? check.getExpectedCondition().toUpperCase() : "";
        String afterUpper = afterData != null ? afterData.toUpperCase() : "";

        if (checkTypeStr.contains("HEADER") || expected.contains("STRICT-TRANSPORT-SECURITY") || expected.contains("HEADER")) {
            return afterUpper.contains("STRICT-TRANSPORT-SECURITY") || afterUpper.contains("X-CONTENT-TYPE-OPTIONS") || afterUpper.contains("CONTENT-SECURITY-POLICY") || afterUpper.contains("PRESENT");
        }

        if (checkTypeStr.contains("COOKIE") || expected.contains("SECURE") || expected.contains("HTTPONLY")) {
            return afterUpper.contains("SECURE") || afterUpper.contains("HTTPONLY") || afterUpper.contains("SAMESITE");
        }

        if (checkTypeStr.contains("NUCLEI") || checkTypeStr.contains("ZAP") || checkTypeStr.contains("VULNERABILITY")) {
            return !afterUpper.contains("MATCH_FOUND") && !afterUpper.contains("VULNERABLE") && !afterUpper.contains("ALERT_DETECTED");
        }

        return afterUpper.contains("PASS") || afterUpper.contains("200 OK") || afterUpper.contains("VALIDATED");
    }

    private String extractObservedValue(String afterData, RetestCheck check) {
        if (afterData == null || afterData.isBlank()) return "No response data";
        if (afterData.length() > 200) {
            return afterData.substring(0, 197) + "...";
        }
        return afterData;
    }
}
