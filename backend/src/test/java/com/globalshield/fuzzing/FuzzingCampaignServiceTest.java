package com.globalshield.fuzzing;

import com.globalshield.audit.AuditService;
import com.globalshield.defense.service.DefenseService;
import com.globalshield.fuzzing.analysis.FuzzingResultAnalyzer;
import com.globalshield.fuzzing.correlator.FuzzingFindingCorrelator;
import com.globalshield.fuzzing.coverage.FuzzingCoverageService;
import com.globalshield.fuzzing.dto.CreateFuzzingCampaignRequest;
import com.globalshield.fuzzing.dto.FuzzingCampaignResponse;
import com.globalshield.fuzzing.entity.FuzzingCampaign;
import com.globalshield.fuzzing.entity.FuzzingProfile;
import com.globalshield.fuzzing.entity.FuzzingStatus;
import com.globalshield.fuzzing.execution.FuzzingExecutionService;
import com.globalshield.fuzzing.payload.FuzzingPayload;
import com.globalshield.fuzzing.payload.FuzzingPayloadProvider;
import com.globalshield.fuzzing.policy.FuzzingPolicyValidator;
import com.globalshield.fuzzing.repository.*;
import com.globalshield.fuzzing.schema.OpenApiSchemaParser;
import com.globalshield.fuzzing.service.FuzzingCampaignService;
import com.globalshield.investigation.InvestigationRepository;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FuzzingCampaignServiceTest {

    @Mock private FuzzingCampaignRepository campaignRepository;
    @Mock private FuzzingTestCaseRepository testCaseRepository;
    @Mock private FuzzingExecutionRecordRepository executionRepository;
    @Mock private FuzzingCoverageResultRepository coverageRepository;
    @Mock private FuzzingMultiStepSequenceRepository sequenceRepository;
    @Mock private SecurityTargetRepository targetRepository;
    @Mock private com.globalshield.assessment.SecurityAssessmentRepository assessmentRepository;
    @Mock private com.globalshield.attacksurface.repository.WebEndpointRepository endpointRepository;
    @Mock private com.globalshield.attacksurface.repository.WebEndpointParameterRepository parameterRepository;
    @Mock private com.globalshield.finding.repository.SecurityFindingRepository findingRepository;
    @Mock private InvestigationRepository investigationRepository;
    @Mock private FuzzingPolicyValidator policyValidator;
    @Mock private FuzzingPayloadProvider payloadProvider;
    @Mock private FuzzingExecutionService executionService;
    @Mock private FuzzingResultAnalyzer resultAnalyzer;
    @Mock private FuzzingFindingCorrelator findingCorrelator;
    @Mock private FuzzingCoverageService coverageService;
    @Mock private OpenApiSchemaParser openApiSchemaParser;
    @Mock private DefenseService defenseService;
    @Mock private AuditService auditService;

    private FuzzingCampaignService campaignService;
    private SecurityTarget target;

    @BeforeEach
    void setUp() {
        campaignService = new FuzzingCampaignService(
                campaignRepository, testCaseRepository, executionRepository, coverageRepository,
                sequenceRepository, targetRepository, assessmentRepository, endpointRepository,
                parameterRepository, findingRepository, investigationRepository, policyValidator,
                payloadProvider, executionService, resultAnalyzer, findingCorrelator,
                coverageService, openApiSchemaParser, defenseService, auditService
        );

        target = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Test Web App")
                .primaryUrl("https://target.local")
                .build();
    }

    @Test
    void testCreateCampaignSuccess() {
        CreateFuzzingCampaignRequest req = CreateFuzzingCampaignRequest.builder()
                .targetId(target.getId())
                .name("Sprint 42 Fuzzing Run")
                .profile(FuzzingProfile.SAFE_ACTIVE_FUZZ)
                .rateLimitRps(5)
                .maxRequests(50)
                .build();

        when(targetRepository.findById(target.getId())).thenReturn(Optional.of(target));
        when(payloadProvider.getPayloadsForProfile(any(), any())).thenReturn(List.of(
                FuzzingPayload.builder()
                        .name("SQL Syntax")
                        .payloadType("SQL_INJECTION_SYNTAX")
                        .owaspCategory(com.globalshield.fuzzing.entity.OwaspCategory.A03)
                        .testValue("'")
                        .baselineValue("1")
                        .build()
        ));
        when(campaignRepository.save(any(FuzzingCampaign.class))).thenAnswer(inv -> {
            FuzzingCampaign c = inv.getArgument(0);
            if (c.getId() == null) c.setId(UUID.randomUUID());
            return c;
        });

        FuzzingCampaignResponse resp = campaignService.createCampaign(req, UUID.randomUUID(), "analyst@example.com");

        assertNotNull(resp);
        assertEquals("Sprint 42 Fuzzing Run", resp.getName());
        assertEquals(FuzzingStatus.PENDING, resp.getStatus());
        verify(policyValidator).validateCampaignPolicy(eq(target), eq(req));
        verify(coverageService).evaluateCoverage(any());
    }

    @Test
    void testCancelCampaign() {
        UUID campaignId = UUID.randomUUID();
        FuzzingCampaign campaign = FuzzingCampaign.builder()
                .id(campaignId)
                .target(target)
                .name("Active Run")
                .status(FuzzingStatus.RUNNING)
                .build();

        when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        FuzzingCampaignResponse resp = campaignService.cancelCampaign(campaignId, UUID.randomUUID(), "analyst@example.com");

        assertEquals(FuzzingStatus.CANCELLED, resp.getStatus());
    }
}
