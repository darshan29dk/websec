package com.globalshield.posture.service;

import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.audit.AuditEventType;
import com.globalshield.audit.AuditService;
import com.globalshield.finding.entity.FindingSeverity;
import com.globalshield.posture.dto.*;
import com.globalshield.posture.entity.*;
import com.globalshield.posture.repository.*;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityPostureService {

    private final SecurityTargetRepository targetRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final SecurityPostureSnapshotRepository snapshotRepository;
    private final SecurityPostureDimensionRepository dimensionRepository;
    private final PostureScoreFactorRepository factorRepository;
    private final SecurityRegressionRepository regressionRepository;
    private final PostureEvidenceCollector evidenceCollector;
    private final PostureDimensionCalculator dimensionCalculator;
    private final SecurityScoreCalculator scoreCalculator;
    private final RegressionDetectionService regressionDetectionService;
    private final AuditService auditService;

    @Transactional
    public SecurityPostureSnapshotDto calculateTargetPosture(UUID targetId, UUID assessmentId, String userEmail) {
        SecurityTarget target = targetRepository.findById(targetId)
            .orElseThrow(() -> new IllegalArgumentException("Target not found: " + targetId));

        SecurityAssessment assessment = assessmentId != null ? assessmentRepository.findById(assessmentId).orElse(null) : null;

        // Run regression detection if we have previous and current assessment
        if (target != null) {
            List<SecurityAssessment> completed = assessmentRepository.findTop2ByTargetIdAndStatusOrderByCompletedAtDesc(targetId, AssessmentStatus.COMPLETED);
            if (completed.size() >= 2) {
                regressionDetectionService.detectRegressions(target, completed.get(1), completed.get(0));
            } else if (completed.size() == 1 && assessment != null && !assessment.getId().equals(completed.get(0).getId())) {
                regressionDetectionService.detectRegressions(target, completed.get(0), assessment);
            }
        }

        // Collect evidence
        PostureEvidenceCollector.TargetPostureEvidence evidence = evidenceCollector.collect(targetId, assessmentId);

        // Calculate dimensions
        List<PostureDimensionCalculator.DimensionCalculationResult> dimensionResults = dimensionCalculator.calculateAllDimensions(evidence);

        // Calculate overall score
        SecurityScoreCalculator.ScoreCalculationResult scoreResult = scoreCalculator.calculateOverallScore(dimensionResults, evidence.isHasSufficientData());

        // Previous snapshot score
        Optional<SecurityPostureSnapshot> prevSnapshotOpt = snapshotRepository.findTopByTargetIdOrderByCalculatedAtDesc(targetId);
        Integer previousScore = prevSnapshotOpt.map(SecurityPostureSnapshot::getOverallScore).orElse(null);
        Integer scoreDelta = (previousScore != null && scoreResult.getScoreStatus() == PostureStatus.VALID)
            ? scoreResult.getOverallScore() - previousScore
            : null;

        // Build & save snapshot
        SecurityPostureSnapshot snapshot = SecurityPostureSnapshot.builder()
            .target(target)
            .assessment(assessment)
            .overallScore(scoreResult.getOverallScore())
            .riskLevel(scoreResult.getRiskLevel())
            .scoreStatus(scoreResult.getScoreStatus())
            .previousScore(previousScore)
            .scoreDelta(scoreDelta)
            .scoreVersion("1.0")
            .calculatedAt(Instant.now())
            .build();

        snapshot = snapshotRepository.save(snapshot);

        // Save dimensions
        List<SecurityPostureDimension> savedDimensions = new ArrayList<>();
        for (var dimRes : dimensionResults) {
            SecurityPostureDimension dimEntity = SecurityPostureDimension.builder()
                .snapshot(snapshot)
                .dimension(dimRes.getDimension())
                .score(dimRes.getScore())
                .status(dimRes.getStatus())
                .evidenceCount(dimRes.getEvidenceCount())
                .explanation(dimRes.getExplanation())
                .build();
            savedDimensions.add(dimensionRepository.save(dimEntity));
        }

        // Save factors
        List<PostureScoreFactor> savedFactors = new ArrayList<>();
        if (scoreResult.getAllFactors() != null) {
            for (var factorDraft : scoreResult.getAllFactors()) {
                PostureScoreFactor factorEntity = PostureScoreFactor.builder()
                    .snapshot(snapshot)
                    .dimension(factorDraft.getDimension())
                    .factorType(factorDraft.getFactorType())
                    .factorName(factorDraft.getFactorName())
                    .impact(factorDraft.getImpact())
                    .weight(factorDraft.getWeight())
                    .evidenceReference(factorDraft.getEvidenceReference())
                    .explanation(factorDraft.getExplanation())
                    .build();
                savedFactors.add(factorRepository.save(factorEntity));
            }
        }

        snapshot.setDimensions(savedDimensions);
        snapshot.setFactors(savedFactors);

        auditService.logEvent(
            null,
            userEmail != null ? userEmail : "SYSTEM",
            AuditEventType.POSTURE_CALCULATED,
            "TARGET",
            targetId.toString(),
            "CALCULATE_POSTURE",
            "Calculated security posture score: " + scoreResult.getOverallScore() + " (" + scoreResult.getRiskLevel() + ")",
            null,
            null
        );

        return toSnapshotDto(snapshot);
    }

    @Transactional(readOnly = true)
    public SecurityPostureSnapshotDto getCurrentPosture(UUID targetId) {
        Optional<SecurityPostureSnapshot> snapshotOpt = snapshotRepository.findTopByTargetIdOrderByCalculatedAtDesc(targetId);
        if (snapshotOpt.isEmpty()) {
            // Calculate initial posture if none exists
            return calculateTargetPosture(targetId, null, "SYSTEM");
        }
        return toSnapshotDto(snapshotOpt.get());
    }

    @Transactional(readOnly = true)
    public List<SecurityPostureSnapshotDto> getPostureHistory(UUID targetId) {
        return snapshotRepository.findByTargetIdOrderByCalculatedAtDesc(targetId)
            .stream()
            .map(this::toSnapshotDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SecurityPostureDimensionDto> getPostureDimensions(UUID targetId) {
        SecurityPostureSnapshotDto current = getCurrentPosture(targetId);
        return current.dimensions();
    }

    @Transactional(readOnly = true)
    public List<PostureScoreFactorDto> getPostureFactors(UUID targetId) {
        SecurityPostureSnapshotDto current = getCurrentPosture(targetId);
        return current.factors();
    }

    @Transactional(readOnly = true)
    public List<PostureTrendPointDto> getPostureTrends(UUID targetId) {
        List<SecurityPostureSnapshot> snapshots = snapshotRepository.findTop10ByTargetIdOrderByCalculatedAtDesc(targetId);
        List<PostureTrendPointDto> points = new ArrayList<>();

        for (SecurityPostureSnapshot s : snapshots) {
            PostureEvidenceCollector.TargetPostureEvidence ev = evidenceCollector.collect(targetId, s.getAssessment() != null ? s.getAssessment().getId() : null);
            long regCount = regressionRepository.countByTargetIdAndStatus(targetId, RegressionStatus.CONFIRMED);
            points.add(new PostureTrendPointDto(
                s.getId().toString(),
                s.getAssessment() != null ? s.getAssessment().getId().toString() : null,
                s.getOverallScore(),
                s.getRiskLevel(),
                s.getCalculatedAt(),
                (int) ev.getCriticalOpenCount(),
                (int) ev.getHighOpenCount(),
                (int) ev.getMediumOpenCount(),
                (int) ev.getLowOpenCount(),
                (int) regCount
            ));
        }

        // Return chronological order
        Collections.reverse(points);
        return points;
    }

    @Transactional
    public SecurityPostureSnapshotDto recalculatePosture(UUID targetId, String userEmail) {
        auditService.logEvent(
            null,
            userEmail != null ? userEmail : "SYSTEM",
            AuditEventType.POSTURE_RECALCULATED,
            "TARGET",
            targetId.toString(),
            "RECALCULATE_POSTURE",
            "Authorized posture recalculation triggered from stored evidence.",
            null,
            null
        );
        return calculateTargetPosture(targetId, null, userEmail);
    }

    @Transactional(readOnly = true)
    public List<SecurityRegressionDto> getRegressions(UUID targetId, RegressionType type, RegressionConfidence confidence, RegressionStatus status) {
        List<SecurityRegression> list;
        if (type != null) {
            list = regressionRepository.findByTargetIdAndRegressionType(targetId, type);
        } else if (status != null) {
            list = regressionRepository.findByTargetIdAndStatus(targetId, status);
        } else if (confidence != null) {
            list = regressionRepository.findByTargetIdAndConfidence(targetId, confidence);
        } else {
            list = regressionRepository.findByTargetIdOrderByDetectedAtDesc(targetId);
        }
        return list.stream().map(this::toRegressionDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SecurityRegressionDto getRegressionDetails(UUID regressionId) {
        SecurityRegression reg = regressionRepository.findById(regressionId)
            .orElseThrow(() -> new IllegalArgumentException("Regression not found: " + regressionId));
        return toRegressionDto(reg);
    }

    @Transactional(readOnly = true)
    public RegressionSummaryDto getRegressionSummary(UUID targetId) {
        List<SecurityRegression> all = regressionRepository.findByTargetIdOrderByDetectedAtDesc(targetId);
        long total = all.size();
        long confirmed = all.stream().filter(r -> r.getStatus() == RegressionStatus.CONFIRMED).count();
        long potential = all.stream().filter(r -> r.getStatus() == RegressionStatus.POTENTIAL).count();
        long resolved = all.stream().filter(r -> r.getStatus() == RegressionStatus.RESOLVED).count();

        PostureEvidenceCollector.TargetPostureEvidence ev = evidenceCollector.collect(targetId, null);
        long fixedCount = ev.getFixedCount();

        double regressionRate = (fixedCount + confirmed) > 0 ? (double) confirmed / (fixedCount + confirmed) * 100.0 : -1.0;

        List<SecurityRegressionDto> recent = all.stream().limit(5).map(this::toRegressionDto).collect(Collectors.toList());

        return new RegressionSummaryDto(
            targetId.toString(),
            total,
            confirmed,
            potential,
            resolved,
            Math.round(regressionRate * 10.0) / 10.0,
            recent
        );
    }

    private SecurityPostureSnapshotDto toSnapshotDto(SecurityPostureSnapshot s) {
        List<SecurityPostureDimensionDto> dimDtos = dimensionRepository.findBySnapshotId(s.getId())
            .stream()
            .map(this::toDimensionDto)
            .collect(Collectors.toList());

        List<PostureScoreFactorDto> factorDtos = factorRepository.findBySnapshotId(s.getId())
            .stream()
            .map(this::toFactorDto)
            .collect(Collectors.toList());

        return new SecurityPostureSnapshotDto(
            s.getId().toString(),
            s.getUuid(),
            s.getTarget().getId().toString(),
            s.getAssessment() != null ? s.getAssessment().getId().toString() : null,
            s.getOverallScore(),
            s.getRiskLevel(),
            s.getScoreStatus(),
            s.getPreviousScore(),
            s.getScoreDelta(),
            s.getScoreVersion(),
            s.getCalculatedAt(),
            s.getCreatedAt(),
            dimDtos,
            factorDtos
        );
    }

    private SecurityPostureDimensionDto toDimensionDto(SecurityPostureDimension d) {
        List<PostureScoreFactorDto> factors = factorRepository.findBySnapshotIdAndDimension(d.getSnapshot().getId(), d.getDimension())
            .stream()
            .map(this::toFactorDto)
            .collect(Collectors.toList());

        return new SecurityPostureDimensionDto(
            d.getId().toString(),
            d.getUuid(),
            d.getSnapshot().getId().toString(),
            d.getDimension(),
            d.getScore(),
            d.getStatus(),
            d.getEvidenceCount(),
            d.getExplanation(),
            d.getCreatedAt(),
            factors
        );
    }

    private PostureScoreFactorDto toFactorDto(PostureScoreFactor f) {
        return new PostureScoreFactorDto(
            f.getId().toString(),
            f.getUuid(),
            f.getSnapshot().getId().toString(),
            f.getDimension(),
            f.getFactorType(),
            f.getFactorName(),
            f.getImpact(),
            f.getWeight(),
            f.getEvidenceReference(),
            f.getExplanation(),
            f.getCreatedAt()
        );
    }

    private SecurityRegressionDto toRegressionDto(SecurityRegression r) {
        String title = r.getCurrentFinding() != null ? r.getCurrentFinding().getTitle() :
            (r.getPreviousFinding() != null ? r.getPreviousFinding().getTitle() : "Unknown Finding");

        return new SecurityRegressionDto(
            r.getId().toString(),
            r.getUuid(),
            r.getTarget().getId().toString(),
            r.getPreviousAssessment() != null ? r.getPreviousAssessment().getId().toString() : null,
            r.getCurrentAssessment() != null ? r.getCurrentAssessment().getId().toString() : null,
            r.getFindingFingerprint(),
            r.getPreviousFinding() != null ? r.getPreviousFinding().getId().toString() : null,
            r.getCurrentFinding() != null ? r.getCurrentFinding().getId().toString() : null,
            title,
            r.getRegressionType(),
            r.getConfidence(),
            r.getStatus(),
            r.getExplanation(),
            r.getDetectedAt(),
            r.getCreatedAt()
        );
    }
}
