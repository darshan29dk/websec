package com.globalshield.fuzzing;

import com.globalshield.fuzzing.coverage.FuzzingCoverageService;
import com.globalshield.fuzzing.entity.*;
import com.globalshield.fuzzing.repository.FuzzingCoverageResultRepository;
import com.globalshield.fuzzing.repository.FuzzingExecutionRecordRepository;
import com.globalshield.fuzzing.repository.FuzzingTestCaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FuzzingCoverageServiceTest {

    @Mock
    private FuzzingCoverageResultRepository coverageRepository;

    @Mock
    private FuzzingTestCaseRepository testCaseRepository;

    @Mock
    private FuzzingExecutionRecordRepository executionRepository;

    private FuzzingCoverageService coverageService;
    private FuzzingCampaign campaign;

    @BeforeEach
    void setUp() {
        coverageService = new FuzzingCoverageService(coverageRepository, testCaseRepository, executionRepository);
        campaign = FuzzingCampaign.builder()
                .id(UUID.randomUUID())
                .name("Coverage Test Campaign")
                .profile(FuzzingProfile.SAFE_ACTIVE_FUZZ)
                .build();
    }

    @Test
    void testOwaspTop10CoverageDistinguishesLimitations() {
        UUID tcId = UUID.randomUUID();
        FuzzingTestCase injectionCase = FuzzingTestCase.builder()
                .id(tcId)
                .category("A03 - Injection")
                .name("SQL Syntax Test")
                .build();

        FuzzingExecutionRecord record = FuzzingExecutionRecord.builder()
                .testCase(injectionCase)
                .resultClassification(TestResultClassification.VULNERABILITY_CONFIRMED)
                .build();

        when(testCaseRepository.findByCampaignIdOrderByExecutionOrderAsc(campaign.getId())).thenReturn(List.of(injectionCase));
        when(executionRepository.findByCampaignIdOrderByExecutedAtDesc(campaign.getId())).thenReturn(List.of(record));
        when(coverageRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<FuzzingCoverageResult> coverage = coverageService.evaluateCoverage(campaign);

        assertEquals(10, coverage.size(), "Coverage matrix must evaluate all 10 OWASP Top 10 categories");

        // A03 Injection should be confirmed
        FuzzingCoverageResult a03 = coverage.stream().filter(c -> c.getOwaspCategory().equals("A03")).findFirst().orElseThrow();
        assertEquals(CoverageStatus.CONFIRMED, a03.getStatus());
        assertEquals(1, a03.getExecutedChecksCount());

        // A02 Cryptographic Failures should be NOT_CONFIGURED
        FuzzingCoverageResult a02 = coverage.stream().filter(c -> c.getOwaspCategory().equals("A02")).findFirst().orElseThrow();
        assertEquals(CoverageStatus.NOT_CONFIGURED, a02.getStatus());

        // A04 Insecure Design should be NOT_SUPPORTED with explicit architectural limitation note
        FuzzingCoverageResult a04 = coverage.stream().filter(c -> c.getOwaspCategory().equals("A04")).findFirst().orElseThrow();
        assertEquals(CoverageStatus.NOT_SUPPORTED, a04.getStatus());
        assertTrue(a04.getLimitationsNotes().contains("threat modeling"));
    }
}
