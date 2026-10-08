package com.globalshield.report.service;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.attacksurface.entity.AttackSurfaceAsset;
import com.globalshield.attacksurface.entity.WebEndpoint;
import com.globalshield.attacksurface.repository.AttackSurfaceAssetRepository;
import com.globalshield.attacksurface.repository.WebEndpointRepository;
import com.globalshield.defense.entity.DefenseRecommendation;
import com.globalshield.defense.repository.DefenseRecommendationRepository;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.forensics.entity.ForensicCase;
import com.globalshield.forensics.repository.ForensicCaseRepository;
import com.globalshield.incident.SecurityIncident;
import com.globalshield.incident.SecurityIncidentRepository;

import com.globalshield.posture.entity.SecurityPostureSnapshot;
import com.globalshield.posture.entity.SecurityRegression;
import com.globalshield.posture.repository.SecurityPostureSnapshotRepository;
import com.globalshield.posture.repository.SecurityRegressionRepository;
import com.globalshield.retest.entity.DefenseValidation;
import com.globalshield.retest.repository.DefenseValidationRepository;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportDataAggregator {

    private final SecurityTargetRepository targetRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final SecurityFindingRepository findingRepository;
    private final AttackSurfaceAssetRepository assetRepository;
    private final WebEndpointRepository endpointRepository;
    private final SecurityIncidentRepository incidentRepository;
    private final ForensicCaseRepository forensicCaseRepository;
    private final DefenseRecommendationRepository defenseRepository;
    private final DefenseValidationRepository defenseValidationRepository;
    private final SecurityPostureSnapshotRepository postureSnapshotRepository;
    private final SecurityRegressionRepository regressionRepository;

    @Getter
    @Builder
    public static class SecurityDataSnapshot {
        private SecurityTarget target;
        private SecurityAssessment assessment;
        private SecurityIncident incident;
        private List<SecurityFinding> findings;
        private List<AttackSurfaceAsset> assets;
        private List<WebEndpoint> endpoints;
        private List<ForensicCase> forensicCases;
        private List<DefenseRecommendation> defenseRecommendations;
        private List<DefenseValidation> defenseValidations;
        private SecurityPostureSnapshot postureSnapshot;
        private List<SecurityRegression> regressions;
        private Instant snapshotTimestamp;
    }

    public SecurityDataSnapshot aggregate(UUID targetId, UUID assessmentId, UUID incidentId) {
        SecurityTarget target = targetId != null ? targetRepository.findById(targetId).orElse(null) : null;
        SecurityAssessment assessment = assessmentId != null ? assessmentRepository.findById(assessmentId).orElse(null) : null;
        SecurityIncident incident = incidentId != null ? incidentRepository.findById(incidentId).orElse(null) : null;

        List<SecurityFinding> findings = List.of();
        List<AttackSurfaceAsset> assets = List.of();
        List<WebEndpoint> endpoints = List.of();
        List<DefenseRecommendation> defenseRecommendations = List.of();
        List<DefenseValidation> defenseValidations = List.of();
        List<SecurityRegression> regressions = List.of();
        List<ForensicCase> forensicCases = List.of();
        SecurityPostureSnapshot postureSnapshot = null;

        if (assessmentId != null) {
            findings = findingRepository.findByAssessmentId(assessmentId);
            assets = assetRepository.findByAssessmentId(assessmentId);
            endpoints = endpointRepository.findByAssessmentId(assessmentId);
        } else if (targetId != null) {
            findings = findingRepository.findByAssessmentTargetId(targetId);
            assets = assetRepository.findByAssessmentTargetId(targetId);
            endpoints = endpointRepository.findByAssessmentTargetId(targetId);
        }

        if (targetId != null) {
            defenseRecommendations = defenseRepository.findByFindingAssessmentTargetId(targetId);
            defenseValidations = defenseValidationRepository.findByFindingAssessmentTargetId(targetId);
            regressions = regressionRepository.findByTargetIdOrderByDetectedAtDesc(targetId);
            postureSnapshot = postureSnapshotRepository.findTopByTargetIdOrderByCalculatedAtDesc(targetId).orElse(null);
            forensicCases = forensicCaseRepository.findAll();
        }

        return SecurityDataSnapshot.builder()
            .target(target)
            .assessment(assessment)
            .incident(incident)
            .findings(findings)
            .assets(assets)
            .endpoints(endpoints)
            .forensicCases(forensicCases)
            .defenseRecommendations(defenseRecommendations)
            .defenseValidations(defenseValidations)
            .postureSnapshot(postureSnapshot)
            .regressions(regressions)
            .snapshotTimestamp(Instant.now())
            .build();
    }
}
