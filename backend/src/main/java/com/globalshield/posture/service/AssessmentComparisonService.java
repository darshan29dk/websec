package com.globalshield.posture.service;

import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.finding.entity.FindingStatus;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.posture.dto.AssessmentComparisonDto;
import com.globalshield.posture.entity.SecurityPostureSnapshot;
import com.globalshield.posture.repository.SecurityPostureSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AssessmentComparisonService {

    private final SecurityAssessmentRepository assessmentRepository;
    private final SecurityFindingRepository findingRepository;
    private final SecurityPostureSnapshotRepository postureSnapshotRepository;
    private final FindingFingerprintService fingerprintService;

    public AssessmentComparisonDto compareAssessments(UUID targetId, UUID previousAssessmentId, UUID currentAssessmentId) {
        SecurityAssessment prevAssess = previousAssessmentId != null ? assessmentRepository.findById(previousAssessmentId).orElse(null) : null;
        SecurityAssessment currAssess = currentAssessmentId != null ? assessmentRepository.findById(currentAssessmentId).orElse(null) : null;

        if (currAssess == null) {
            throw new IllegalArgumentException("Current assessment not found: " + currentAssessmentId);
        }

        List<SecurityFinding> currFindings = findingRepository.findByAssessmentId(currAssess.getId());
        List<SecurityFinding> prevFindings = prevAssess != null ? findingRepository.findByAssessmentId(prevAssess.getId()) : List.of();

        Map<String, SecurityFinding> prevMap = new HashMap<>();
        for (SecurityFinding f : prevFindings) {
            prevMap.put(fingerprintService.computeFingerprint(f), f);
        }

        Map<String, SecurityFinding> currMap = new HashMap<>();
        for (SecurityFinding f : currFindings) {
            currMap.put(fingerprintService.computeFingerprint(f), f);
        }

        List<AssessmentComparisonDto.FindingSummaryItem> newFindings = new ArrayList<>();
        List<AssessmentComparisonDto.FindingSummaryItem> fixedFindings = new ArrayList<>();
        List<AssessmentComparisonDto.FindingSummaryItem> unchangedFindings = new ArrayList<>();
        List<AssessmentComparisonDto.FindingSummaryItem> reopenedFindings = new ArrayList<>();

        for (Map.Entry<String, SecurityFinding> entry : currMap.entrySet()) {
            String fp = entry.getKey();
            SecurityFinding currF = entry.getValue();

            if (!prevMap.containsKey(fp)) {
                newFindings.add(toSummary(currF, fp));
            } else {
                SecurityFinding prevF = prevMap.get(fp);
                if (prevF.getStatus() == FindingStatus.FIXED && currF.getStatus() != FindingStatus.FIXED) {
                    reopenedFindings.add(toSummary(currF, fp));
                } else {
                    unchangedFindings.add(toSummary(currF, fp));
                }
            }
        }

        // If current assessment was completed, absent previous findings are marked fixed
        boolean isCompleted = currAssess.getStatus() == AssessmentStatus.COMPLETED;
        if (isCompleted) {
            for (Map.Entry<String, SecurityFinding> entry : prevMap.entrySet()) {
                String fp = entry.getKey();
                SecurityFinding prevF = entry.getValue();

                if (!currMap.containsKey(fp) && prevF.getStatus() != FindingStatus.FIXED) {
                    fixedFindings.add(toSummary(prevF, fp));
                }
            }
        }

        // Posture score delta
        Integer prevScore = null;
        Integer currScore = null;
        Integer scoreDelta = null;

        Optional<SecurityPostureSnapshot> currSnapshotOpt = postureSnapshotRepository.findByAssessmentId(currAssess.getId());
        if (currSnapshotOpt.isPresent()) {
            currScore = currSnapshotOpt.get().getOverallScore();
        }

        if (prevAssess != null) {
            Optional<SecurityPostureSnapshot> prevSnapshotOpt = postureSnapshotRepository.findByAssessmentId(prevAssess.getId());
            if (prevSnapshotOpt.isPresent()) {
                prevScore = prevSnapshotOpt.get().getOverallScore();
            }
        }

        if (currScore != null && prevScore != null) {
            scoreDelta = currScore - prevScore;
        }

        String explanation = String.format("Comparison between Assessment %s and Assessment %s: %d new, %d fixed, %d unchanged, %d reopened findings.",
            prevAssess != null ? prevAssess.getId() : "N/A",
            currAssess.getId(),
            newFindings.size(),
            fixedFindings.size(),
            unchangedFindings.size(),
            reopenedFindings.size());

        return new AssessmentComparisonDto(
            targetId.toString(),
            prevAssess != null ? prevAssess.getId().toString() : null,
            currAssess.getId().toString(),
            prevScore,
            currScore,
            scoreDelta,
            newFindings,
            fixedFindings,
            unchangedFindings,
            reopenedFindings,
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            explanation
        );
    }

    private AssessmentComparisonDto.FindingSummaryItem toSummary(SecurityFinding f, String fp) {
        String path = f.getEndpoint() != null ? f.getEndpoint().getPath() : "N/A";
        return new AssessmentComparisonDto.FindingSummaryItem(
            f.getId().toString(),
            fp,
            f.getTitle(),
            f.getSeverity() != null ? f.getSeverity().name() : "UNKNOWN",
            f.getStatus() != null ? f.getStatus().name() : "OPEN",
            path
        );
    }
}
