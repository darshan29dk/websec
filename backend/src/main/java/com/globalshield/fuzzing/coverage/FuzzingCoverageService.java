package com.globalshield.fuzzing.coverage;

import com.globalshield.fuzzing.entity.*;
import com.globalshield.fuzzing.repository.FuzzingCoverageResultRepository;
import com.globalshield.fuzzing.repository.FuzzingExecutionRecordRepository;
import com.globalshield.fuzzing.repository.FuzzingTestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FuzzingCoverageService {

    private final FuzzingCoverageResultRepository coverageRepository;
    private final FuzzingTestCaseRepository testCaseRepository;
    private final FuzzingExecutionRecordRepository executionRepository;

    @Transactional
    public List<FuzzingCoverageResult> evaluateCoverage(FuzzingCampaign campaign) {
        coverageRepository.deleteByCampaignId(campaign.getId());

        List<FuzzingTestCase> testCases = testCaseRepository.findByCampaignIdOrderByExecutionOrderAsc(campaign.getId());
        List<FuzzingExecutionRecord> executions = executionRepository.findByCampaignIdOrderByExecutedAtDesc(campaign.getId());

        List<FuzzingCoverageResult> results = new ArrayList<>();

        for (OwaspCategory cat : OwaspCategory.values()) {
            results.add(calculateCategoryCoverage(campaign, cat, testCases, executions));
        }

        return coverageRepository.saveAll(results);
    }

    private FuzzingCoverageResult calculateCategoryCoverage(
            FuzzingCampaign campaign,
            OwaspCategory category,
            List<FuzzingTestCase> allCases,
            List<FuzzingExecutionRecord> allExecutions
    ) {
        String code = category.getCode();
        String title = category.getTitle();

        // Count cases belonging to this category
        List<FuzzingTestCase> catCases = allCases.stream()
                .filter(c -> c.getCategory().contains(code))
                .toList();

        int supportedCount = catCases.size();
        int executedCount = 0;
        boolean hasConfirmed = false;
        boolean hasSuspicious = false;
        boolean hasBlocked = false;

        for (FuzzingTestCase tc : catCases) {
            Optional<FuzzingExecutionRecord> execOpt = allExecutions.stream()
                    .filter(e -> e.getTestCase().getId().equals(tc.getId()))
                    .findFirst();

            if (execOpt.isPresent()) {
                executedCount++;
                TestResultClassification res = execOpt.get().getResultClassification();
                if (res == TestResultClassification.VULNERABILITY_CONFIRMED) {
                    hasConfirmed = true;
                } else if (res == TestResultClassification.SUSPICIOUS) {
                    hasSuspicious = true;
                } else if (res == TestResultClassification.BLOCKED) {
                    hasBlocked = true;
                }
            }
        }

        CoverageStatus status;
        String notes;

        switch (category) {
            case A02:
                status = CoverageStatus.NOT_CONFIGURED;
                notes = "Requires TLS cipher configuration inspection (testssl.sh) and SSL/TLS certificate chain auditing. Generic HTTP fuzzing cannot verify cryptographic implementations.";
                break;
            case A04:
                status = CoverageStatus.NOT_SUPPORTED;
                notes = "Requires architectural threat modeling, business logic specification, and design review. Insecure design cannot be proven by automated HTTP parameter fuzzing.";
                break;
            case A06:
                status = CoverageStatus.NOT_CONFIGURED;
                notes = "Requires Software Bill of Materials (SBOM) and dependency analysis (e.g. OWASP Dependency-Check / WhatWeb).";
                break;
            case A08:
                status = CoverageStatus.NOT_SUPPORTED;
                notes = "Requires code signing validation, CI/CD pipeline integrity review, and serialization format verification.";
                break;
            case A09:
                status = CoverageStatus.NOT_SUPPORTED;
                notes = "Requires SIEM and audit logging telemetry review (e.g. Wazuh / Splunk connectors) to verify alert triggering and retention.";
                break;
            default:
                if (supportedCount == 0) {
                    status = CoverageStatus.NOT_RUN;
                    notes = "No test cases configured for this category in the selected fuzzing profile.";
                } else if (executedCount == 0) {
                    status = CoverageStatus.NOT_RUN;
                    notes = supportedCount + " test cases configured; awaiting execution.";
                } else if (hasConfirmed) {
                    status = CoverageStatus.CONFIRMED;
                    notes = "Vulnerability confirmed via deterministic evidence. " + executedCount + "/" + supportedCount + " test cases executed.";
                } else if (hasSuspicious) {
                    status = CoverageStatus.SUSPECTED;
                    notes = "Suspicious behavior or error disclosure observed; manual review recommended. " + executedCount + "/" + supportedCount + " test cases executed.";
                } else if (hasBlocked) {
                    status = CoverageStatus.BLOCKED;
                    notes = "One or more test cases blocked by scope or security policy guardrails.";
                } else {
                    status = CoverageStatus.PASSED;
                    notes = "All " + executedCount + " executed tests were properly handled/rejected by target without observable anomalies.";
                }
                break;
        }

        return FuzzingCoverageResult.builder()
                .campaign(campaign)
                .owaspCategory(code)
                .categoryName(title)
                .supportedChecksCount(supportedCount)
                .executedChecksCount(executedCount)
                .status(status)
                .limitationsNotes(notes)
                .testedAt(Instant.now())
                .build();
    }
}
