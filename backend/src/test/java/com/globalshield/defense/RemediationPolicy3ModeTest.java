package com.globalshield.defense;

import com.globalshield.audit.AuditService;
import com.globalshield.defense.dto.CreateRemediationPlanRequest;
import com.globalshield.defense.dto.RemediationPlanDto;
import com.globalshield.defense.entity.RemediationPlan;
import com.globalshield.defense.repository.*;
import com.globalshield.defense.service.DefenseService;
import com.globalshield.finding.repository.SecurityFindingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RemediationPolicy3ModeTest {

    @Mock private DefenseRecommendationRepository recommendationRepository;
    @Mock private DefenseEvidenceRepository evidenceRepository;
    @Mock private DefenseControlRepository controlRepository;
    @Mock private FindingDefenseControlRepository findingDefenseControlRepository;
    @Mock private RemediationPlanRepository planRepository;
    @Mock private RemediationTaskRepository taskRepository;
    @Mock private DefenseValidationPlanRepository validationPlanRepository;
    @Mock private SecurityFindingRepository findingRepository;
    @Mock private com.globalshield.defense.engine.DefenseEngine defenseEngine;
    @Mock private AuditService auditService;

    private DefenseService defenseService;

    @BeforeEach
    void setUp() {
        defenseService = new DefenseService(
                recommendationRepository, evidenceRepository, controlRepository, findingDefenseControlRepository,
                planRepository, taskRepository, validationPlanRepository, findingRepository,
                defenseEngine, auditService, null, new com.fasterxml.jackson.databind.ObjectMapper()
        );
    }

    @Test
    void testCreateControlledAutomatedPlanRequiresApproval() {
        CreateRemediationPlanRequest req = new CreateRemediationPlanRequest();
        req.setTitle("HSTS Security Header Deployment");
        req.setRemediationMode("CONTROLLED_AUTOMATED");
        req.setRiskLevel("LOW");
        req.setAutomatedActionType("APPLY_SECURITY_HEADER");

        when(planRepository.save(any())).thenAnswer(inv -> {
            RemediationPlan p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        RemediationPlanDto plan = defenseService.createRemediationPlan(req, "developer@globalshield.internal");

        assertEquals("CONTROLLED_AUTOMATED", plan.getRemediationMode());
        assertEquals("PENDING_APPROVAL", plan.getApprovalStatus());
        assertTrue(plan.isAutomatedExecutable());
    }

    @Test
    void testAutomatedExecutionBlockedWithoutApproval() {
        UUID planId = UUID.randomUUID();
        RemediationPlan unapprovedPlan = RemediationPlan.builder()
                .id(planId)
                .title("Unapproved Script Change")
                .remediationMode("CONTROLLED_AUTOMATED")
                .riskLevel("LOW")
                .approvalStatus("PENDING_APPROVAL")
                .build();

        when(planRepository.findById(planId)).thenReturn(Optional.of(unapprovedPlan));

        assertThrows(IllegalArgumentException.class, () ->
                defenseService.executeAutomatedRemediation(planId, "operator@globalshield.internal"));
    }

    @Test
    void testHighRiskActionCannotBeAutomaticallyExecuted() {
        UUID planId = UUID.randomUUID();
        RemediationPlan highRiskPlan = RemediationPlan.builder()
                .id(planId)
                .title("Database Schema Migration")
                .remediationMode("CONTROLLED_AUTOMATED")
                .riskLevel("HIGH") // High risk!
                .approvalStatus("APPROVED")
                .build();

        when(planRepository.findById(planId)).thenReturn(Optional.of(highRiskPlan));

        assertThrows(IllegalArgumentException.class, () ->
                defenseService.executeAutomatedRemediation(planId, "operator@globalshield.internal"));
    }

    @Test
    void testApprovedLowRiskAutomatedExecutionTransitionsToVerificationPending() {
        UUID planId = UUID.randomUUID();
        RemediationPlan approvedPlan = RemediationPlan.builder()
                .id(planId)
                .title("Set X-Content-Type-Options: nosniff")
                .remediationMode("CONTROLLED_AUTOMATED")
                .riskLevel("LOW")
                .approvalStatus("APPROVED")
                .automatedActionType("ADD_HTTP_HEADER")
                .status("OPEN")
                .build();

        when(planRepository.findById(planId)).thenReturn(Optional.of(approvedPlan));
        when(planRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RemediationPlanDto executed = defenseService.executeAutomatedRemediation(planId, "operator@globalshield.internal");

        assertEquals("VERIFICATION_PENDING", executed.getStatus(), "Must transition to VERIFICATION_PENDING for retesting");
        assertEquals("EXECUTED", executed.getExecutionStatus());
    }
}
