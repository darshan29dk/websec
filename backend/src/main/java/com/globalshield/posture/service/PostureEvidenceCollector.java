package com.globalshield.posture.service;

import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.attacksurface.repository.AttackSurfaceAssetRepository;
import com.globalshield.attacksurface.repository.WebEndpointRepository;
import com.globalshield.defense.repository.DefenseRecommendationRepository;
import com.globalshield.finding.entity.FindingSeverity;
import com.globalshield.finding.entity.FindingStatus;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.posture.entity.RegressionStatus;
import com.globalshield.posture.repository.SecurityRegressionRepository;
import com.globalshield.retest.entity.ValidationStatus;
import com.globalshield.retest.repository.DefenseValidationRepository;
import com.globalshield.retest.repository.RetestRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostureEvidenceCollector {

    private final SecurityFindingRepository findingRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final AttackSurfaceAssetRepository assetRepository;
    private final WebEndpointRepository endpointRepository;
    private final DefenseValidationRepository defenseValidationRepository;
    private final RetestRepository retestRepository;
    private final SecurityRegressionRepository regressionRepository;

    @Getter
    @Builder
    public static class TargetPostureEvidence {
        private UUID targetId;
        private UUID assessmentId;
        private List<SecurityAssessment> completedAssessments;
        private List<SecurityFinding> allFindings;
        private long criticalOpenCount;
        private long highOpenCount;
        private long mediumOpenCount;
        private long lowOpenCount;
        private long infoOpenCount;
        private long fixedCount;
        private long partiallyFixedCount;
        private long reopenedCount;
        private long regressedCount;
        private long assetCount;
        private long endpointCount;
        private long retestCount;
        private long defenseValidationFixedCount;
        private long defenseValidationFailedCount;
        private long confirmedRegressionCount;
        private boolean hasSufficientData;
    }

    public TargetPostureEvidence collect(UUID targetId, UUID assessmentId) {
        List<SecurityAssessment> assessments = assessmentRepository.findByTargetIdOrderByCreatedAtDesc(targetId);
        List<SecurityFinding> findings;
        
        if (assessmentId != null) {
            findings = findingRepository.findByAssessmentId(assessmentId);
        } else {
            findings = findingRepository.findByAssessmentTargetId(targetId);
        }

        long critical = findings.stream().filter(f -> f.getSeverity() == FindingSeverity.CRITICAL && isUnresolved(f)).count();
        long high = findings.stream().filter(f -> f.getSeverity() == FindingSeverity.HIGH && isUnresolved(f)).count();
        long medium = findings.stream().filter(f -> f.getSeverity() == FindingSeverity.MEDIUM && isUnresolved(f)).count();
        long low = findings.stream().filter(f -> f.getSeverity() == FindingSeverity.LOW && isUnresolved(f)).count();
        long info = findings.stream().filter(f -> f.getSeverity() == FindingSeverity.INFO && isUnresolved(f)).count();

        long fixed = findings.stream().filter(f -> f.getStatus() == FindingStatus.FIXED).count();
        long partFixed = findings.stream().filter(f -> f.getStatus() == FindingStatus.PARTIALLY_FIXED).count();
        long reopened = findings.stream().filter(f -> f.getStatus() == FindingStatus.REOPENED || f.getStatus() == FindingStatus.REGRESSED).count();

        long assets = assetRepository.countByAssessmentTargetId(targetId);
        long endpoints = endpointRepository.countByAssessmentTargetId(targetId);
        long retests = retestRepository.findByTargetIdOrderByCreatedAtDesc(targetId).size();
        
        var defenseVals = defenseValidationRepository.findByFindingAssessmentTargetId(targetId);
        long valFixed = defenseVals.stream().filter(v -> v.getValidationStatus() == ValidationStatus.FIXED).count();
        long valFailed = defenseVals.stream().filter(v -> v.getValidationStatus() == ValidationStatus.NOT_FIXED || v.getValidationStatus() == ValidationStatus.REGRESSED).count();

        long confirmedRegressions = regressionRepository.countByTargetIdAndStatus(targetId, RegressionStatus.CONFIRMED);

        boolean sufficient = !assessments.isEmpty() || !findings.isEmpty();

        return TargetPostureEvidence.builder()
            .targetId(targetId)
            .assessmentId(assessmentId)
            .completedAssessments(assessments)
            .allFindings(findings)
            .criticalOpenCount(critical)
            .highOpenCount(high)
            .mediumOpenCount(medium)
            .lowOpenCount(low)
            .infoOpenCount(info)
            .fixedCount(fixed)
            .partiallyFixedCount(partFixed)
            .reopenedCount(reopened)
            .regressedCount(reopened)
            .assetCount(assets)
            .endpointCount(endpoints)
            .retestCount(retests)
            .defenseValidationFixedCount(valFixed)
            .defenseValidationFailedCount(valFailed)
            .confirmedRegressionCount(confirmedRegressions)
            .hasSufficientData(sufficient)
            .build();
    }

    private boolean isUnresolved(SecurityFinding f) {
        return f.getStatus() == FindingStatus.OPEN ||
               f.getStatus() == FindingStatus.REMEDIATION_RECOMMENDED ||
               f.getStatus() == FindingStatus.RETEST_PENDING ||
               f.getStatus() == FindingStatus.RETESTING ||
               f.getStatus() == FindingStatus.NOT_FIXED ||
               f.getStatus() == FindingStatus.REOPENED ||
               f.getStatus() == FindingStatus.REGRESSED ||
               f.getStatus() == FindingStatus.INCONCLUSIVE;
    }
}
