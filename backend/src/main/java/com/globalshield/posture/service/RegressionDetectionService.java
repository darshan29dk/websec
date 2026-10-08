package com.globalshield.posture.service;

import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.finding.entity.FindingStatus;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.posture.entity.RegressionConfidence;
import com.globalshield.posture.entity.RegressionStatus;
import com.globalshield.posture.entity.RegressionType;
import com.globalshield.posture.entity.SecurityRegression;
import com.globalshield.posture.repository.SecurityRegressionRepository;
import com.globalshield.target.SecurityTarget;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegressionDetectionService {

    private final FindingFingerprintService fingerprintService;
    private final SecurityFindingRepository findingRepository;
    private final SecurityRegressionRepository regressionRepository;

    public List<SecurityRegression> detectRegressions(
        SecurityTarget target,
        SecurityAssessment previousAssessment,
        SecurityAssessment currentAssessment
    ) {
        if (target == null || currentAssessment == null) {
            return List.of();
        }

        // If current assessment was not completed successfully, cannot reliably mark absent findings fixed or evaluate regressions
        if (currentAssessment.getStatus() == AssessmentStatus.FAILED ||
            currentAssessment.getStatus() == AssessmentStatus.CANCELLED ||
            currentAssessment.getStatus() == AssessmentStatus.PARTIALLY_COMPLETED) {
            log.info("Current assessment {} status is {}; skipping deterministic regression detection.", currentAssessment.getId(), currentAssessment.getStatus());
            return List.of();
        }

        List<SecurityFinding> currentFindings = findingRepository.findByAssessmentId(currentAssessment.getId());
        Map<String, SecurityFinding> currentMap = new HashMap<>();
        for (SecurityFinding f : currentFindings) {
            String fp = fingerprintService.computeFingerprint(f);
            currentMap.put(fp, f);
        }

        List<SecurityRegression> detectedRegressions = new ArrayList<>();

        if (previousAssessment != null) {
            List<SecurityFinding> previousFindings = findingRepository.findByAssessmentId(previousAssessment.getId());
            for (SecurityFinding prevF : previousFindings) {
                String fp = fingerprintService.computeFingerprint(prevF);
                SecurityFinding currF = currentMap.get(fp);

                // Case: Previous finding was FIXED or REMEDIATED, but appears again in current assessment
                if (currF != null && (prevF.getStatus() == FindingStatus.FIXED || prevF.getStatus() == FindingStatus.REMEDIATION_RECOMMENDED)) {
                    log.warn("Regression detected for finding fingerprint {} on target {}", fp, target.getId());
                    
                    // Update current finding status to REOPENED or REGRESSED
                    currF.setStatus(FindingStatus.REOPENED);
                    findingRepository.save(currF);

                    // Check if an existing regression record exists
                    Optional<SecurityRegression> existingOpt = regressionRepository.findByTargetIdAndFindingFingerprintAndStatus(
                        target.getId(), fp, RegressionStatus.CONFIRMED
                    );

                    SecurityRegression regression;
                    if (existingOpt.isPresent()) {
                        regression = existingOpt.get();
                        regression.setCurrentAssessment(currentAssessment);
                        regression.setCurrentFinding(currF);
                        regression.setDetectedAt(Instant.now());
                        regression.setExplanation("Vulnerability reappeared in assessment " + currentAssessment.getId() + " after being previously resolved.");
                    } else {
                        regression = SecurityRegression.builder()
                            .target(target)
                            .previousAssessment(previousAssessment)
                            .currentAssessment(currentAssessment)
                            .findingFingerprint(fp)
                            .previousFinding(prevF)
                            .currentFinding(currF)
                            .regressionType(RegressionType.REOPENED)
                            .confidence(RegressionConfidence.HIGH)
                            .status(RegressionStatus.CONFIRMED)
                            .explanation("Vulnerability matching fingerprint " + fp.substring(0, 8) + "... reappeared in assessment " + currentAssessment.getId() + ".")
                            .detectedAt(Instant.now())
                            .build();
                    }

                    detectedRegressions.add(regressionRepository.save(regression));
                }
            }
        }

        return detectedRegressions;
    }
}
