package com.globalshield.target;

import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.finding.entity.FindingSeverity;
import com.globalshield.finding.entity.FindingStatus;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.target.dto.TargetRiskEvaluationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TargetRiskCalculationService {

    private final SecurityAssessmentRepository assessmentRepository;
    private final SecurityFindingRepository findingRepository;

    public TargetRiskEvaluationDto evaluateTargetRisk(UUID targetId) {
        List<SecurityAssessment> assessments = assessmentRepository.findByTargetIdOrderByCreatedAtDesc(targetId);

        // A newly registered website with no assessments must not be presented as safe or assigned an unsupported score
        if (assessments.isEmpty() || assessments.stream().noneMatch(a -> a.getStatus() == AssessmentStatus.COMPLETED || a.getStatus() == AssessmentStatus.RUNNING)) {
            List<String> factors = new ArrayList<>();
            factors.add("No completed security assessment recorded. Website security posture is currently unassessed.");
            return TargetRiskEvaluationDto.builder()
                    .riskCategory("NOT_ASSESSED")
                    .riskScore(null)
                    .criticalOverrideApplied(false)
                    .contributingFactors(factors)
                    .openCriticalCount(0)
                    .openHighCount(0)
                    .openMediumCount(0)
                    .openLowCount(0)
                    .totalOpenCount(0)
                    .build();
        }

        List<SecurityFinding> allFindings = findingRepository.findByAssessmentTargetId(targetId);

        List<SecurityFinding> openFindings = allFindings.stream()
                .filter(f -> f.getStatus() != FindingStatus.RESOLVED &&
                             f.getStatus() != FindingStatus.FIXED &&
                             f.getStatus() != FindingStatus.FALSE_POSITIVE)
                .toList();

        long criticalCount = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.CRITICAL).count();
        long highCount = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.HIGH).count();
        long mediumCount = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.MEDIUM).count();
        long lowCount = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.LOW || f.getSeverity() == FindingSeverity.INFO).count();
        long totalOpen = openFindings.size();

        List<String> factors = new ArrayList<>();
        boolean criticalOverrideApplied = false;
        String riskCategory;
        int riskScore;

        long rawPenalty = (criticalCount * 25) + (highCount * 15) + (mediumCount * 5) + (lowCount * 1);
        int baseScore = (int) Math.max(0, 100 - rawPenalty);

        // Mandatory Rule: Any website with at least one open confirmed critical finding must be classified as Critical, regardless of score.
        if (criticalCount > 0) {
            criticalOverrideApplied = true;
            riskCategory = "CRITICAL";
            riskScore = Math.min(35, baseScore); // Score capped in critical bracket
            factors.add("CRITICAL FINDING OVERRIDE: Website has " + criticalCount + " open confirmed Critical finding(s). Risk is forced to CRITICAL.");
        } else {
            riskScore = baseScore;
            if (riskScore >= 80) {
                riskCategory = "LOW";
            } else if (riskScore >= 60) {
                riskCategory = "MEDIUM";
            } else if (riskScore >= 40) {
                riskCategory = "HIGH";
            } else {
                riskCategory = "CRITICAL";
            }
        }

        factors.add("Open findings: " + criticalCount + " Critical, " + highCount + " High, " + mediumCount + " Medium, " + lowCount + " Low/Info.");
        factors.add("Calculated from " + assessments.size() + " assessment run(s) and " + allFindings.size() + " total evaluated vulnerability records.");

        return TargetRiskEvaluationDto.builder()
                .riskCategory(riskCategory)
                .riskScore(riskScore)
                .criticalOverrideApplied(criticalOverrideApplied)
                .contributingFactors(factors)
                .openCriticalCount(criticalCount)
                .openHighCount(highCount)
                .openMediumCount(mediumCount)
                .openLowCount(lowCount)
                .totalOpenCount(totalOpen)
                .build();
    }
}
