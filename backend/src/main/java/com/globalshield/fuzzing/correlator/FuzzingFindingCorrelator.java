package com.globalshield.fuzzing.correlator;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.attacksurface.entity.AttackSurfaceAsset;
import com.globalshield.attacksurface.repository.AttackSurfaceAssetRepository;
import com.globalshield.finding.entity.*;
import com.globalshield.finding.repository.FindingEvidenceRepository;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.fuzzing.analysis.FuzzingAnalysisResult;
import com.globalshield.fuzzing.entity.FuzzingCampaign;
import com.globalshield.fuzzing.entity.FuzzingExecutionRecord;
import com.globalshield.fuzzing.entity.FuzzingTestCase;
import com.globalshield.fuzzing.execution.FuzzingExecutionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class FuzzingFindingCorrelator {

    private static final Logger log = LoggerFactory.getLogger(FuzzingFindingCorrelator.class);

    private final SecurityFindingRepository findingRepository;
    private final FindingEvidenceRepository evidenceRepository;
    private final AttackSurfaceAssetRepository assetRepository;

    @Transactional
    public SecurityFinding correlateToFinding(
            FuzzingCampaign campaign,
            FuzzingTestCase testCase,
            FuzzingAnalysisResult analysisResult,
            FuzzingExecutionRecord executionRecord
    ) {
        if (!analysisResult.isFindingWarranted()) {
            return null;
        }

        String targetUrl = testCase.getTargetUrl();
        String title = analysisResult.getFindingTitle() != null
                ? analysisResult.getFindingTitle()
                : "Web Security Fuzzing Finding: " + testCase.getName();

        String dedupHash = FuzzingExecutionService.sha256Hex(
                campaign.getTarget().getId().toString() + ":" + testCase.getName() + ":" + targetUrl + ":" + title
        );

        FindingSeverity severity = mapSeverity(analysisResult.getFindingSeverity());
        FindingConfidence confidence = analysisResult.getConfidence() != null
                ? analysisResult.getConfidence()
                : FindingConfidence.MEDIUM;

        SecurityAssessment assessment = campaign.getAssessment();
        List<AttackSurfaceAsset> assets = assessment != null
                ? assetRepository.findByAssessmentId(assessment.getId())
                : List.of();
        AttackSurfaceAsset defaultAsset = !assets.isEmpty() ? assets.get(0) : null;

        // Check if existing finding with this deduplication hash already exists
        Optional<SecurityFinding> existingOpt = findingRepository.findAll().stream()
                .filter(f -> dedupHash.equalsIgnoreCase(f.getDeduplicationHash()))
                .findFirst();

        SecurityFinding finding;
        if (existingOpt.isPresent()) {
            finding = existingOpt.get();
            finding.setLastSeenAt(Instant.now());
            finding.setConfidence(confidence);
            if (severity.ordinal() > finding.getSeverity().ordinal()) {
                finding.setSeverity(severity);
            }
            findingRepository.save(finding);
            log.info("Correlated fuzzing finding deduplicated with existing finding ID: {}", finding.getId());
        } else {
            finding = SecurityFinding.builder()
                    .assessment(assessment)
                    .asset(defaultAsset)
                    .endpoint(testCase.getEndpoint())
                    .title(title)
                    .description(analysisResult.getFindingDescription() != null
                            ? analysisResult.getFindingDescription()
                            : analysisResult.getAnomalyDetails())
                    .findingType(FindingType.WEB_APPLICATION_ALERT)
                    .severity(severity)
                    .originalSeverity(analysisResult.getFindingSeverity())
                    .confidence(confidence)
                    .status(FindingStatus.OPEN)
                    .source("GlobalShield Web Fuzzing Engine (" + testCase.getPayloadType() + ")")
                    .deduplicationHash(dedupHash)
                    .build();

            finding = findingRepository.save(finding);
            log.info("Created new SecurityFinding ID: {} from fuzzing test case: {}", finding.getId(), testCase.getName());
        }

        // Attach sanitized evidence
        String evidenceData = "Request: " + executionRecord.getRequestMethod() + " " + executionRecord.getRequestUrl() + "\n" +
                "Response Status: " + executionRecord.getResponseStatus() + "\n" +
                "Anomaly: " + analysisResult.getAnomalyDetails() + "\n" +
                "Diff Summary: " + analysisResult.getDiffSummary() + "\n" +
                "Response Hash: " + executionRecord.getResponseHash() + "\n" +
                "Response Snippet:\n" + executionRecord.getResponseBodySnippet();

        evidenceRepository.save(FindingEvidence.builder()
                .finding(finding)
                .evidenceType(EvidenceType.HTTP_RESPONSE)
                .content(evidenceData)
                .location(executionRecord.getRequestUrl())
                .hash(executionRecord.getResponseHash())
                .source("GlobalShield Fuzzing Engine")
                .build());

        return finding;
    }

    private FindingSeverity mapSeverity(String sev) {
        if (sev == null) return FindingSeverity.MEDIUM;
        switch (sev.toUpperCase()) {
            case "CRITICAL": return FindingSeverity.CRITICAL;
            case "HIGH": return FindingSeverity.HIGH;
            case "LOW": return FindingSeverity.LOW;
            case "INFO": return FindingSeverity.INFO;
            default: return FindingSeverity.MEDIUM;
        }
    }
}
