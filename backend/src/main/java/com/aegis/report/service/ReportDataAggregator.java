package com.aegis.report.service;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.SecurityAssessmentRepository;
import com.aegis.attacksurface.entity.AttackSurfaceAsset;
import com.aegis.attacksurface.entity.WebEndpoint;
import com.aegis.attacksurface.repository.AttackSurfaceAssetRepository;
import com.aegis.attacksurface.repository.WebEndpointRepository;
import com.aegis.defense.entity.DefenseRecommendation;
import com.aegis.defense.repository.DefenseRecommendationRepository;
import com.aegis.finding.entity.SecurityFinding;
import com.aegis.finding.repository.SecurityFindingRepository;
import com.aegis.forensics.entity.ForensicCase;
import com.aegis.forensics.repository.ForensicCaseRepository;
import com.aegis.incident.SecurityIncident;
import com.aegis.incident.SecurityIncidentRepository;

import com.aegis.posture.entity.SecurityPostureSnapshot;
import com.aegis.posture.entity.SecurityRegression;
import com.aegis.posture.repository.SecurityPostureSnapshotRepository;
import com.aegis.posture.repository.SecurityRegressionRepository;
import com.aegis.retest.entity.DefenseValidation;
import com.aegis.retest.repository.DefenseValidationRepository;
import com.aegis.target.SecurityTarget;
import com.aegis.target.SecurityTargetRepository;
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
