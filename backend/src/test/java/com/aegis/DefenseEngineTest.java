package com.aegis;

import com.aegis.defense.engine.DefenseEngine;
import com.aegis.defense.entity.DefenseRecommendation;
import com.aegis.defense.entity.DefenseValidationPlan;
import com.aegis.defense.dto.GenerateRecommendationRequest;
import com.aegis.defense.dto.DefenseRecommendationResponseDto;
import com.aegis.defense.repository.*;
import com.aegis.defense.service.DefenseService;
import com.aegis.finding.entity.FindingSeverity;
import com.aegis.finding.entity.FindingType;
import com.aegis.finding.entity.SecurityFinding;
import com.aegis.finding.repository.SecurityFindingRepository;
import com.aegis.audit.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class DefenseEngineTest {

    private DefenseEngine defenseEngine;
    private DefenseService defenseService;
    private SecurityFindingRepository findingRepository;
    private DefenseRecommendationRepository recommendationRepository;
    private DefenseControlRepository controlRepository;
    private DefenseEvidenceRepository evidenceRepository;
    private FindingDefenseControlRepository findingDefenseControlRepository;
    private RemediationPlanRepository planRepository;
    private RemediationTaskRepository taskRepository;
    private DefenseValidationPlanRepository validationPlanRepository;
    private AuditService auditService;

    @BeforeEach
    void setUp() {
        defenseEngine = new DefenseEngine();
        findingRepository = Mockito.mock(SecurityFindingRepository.class);
        recommendationRepository = Mockito.mock(DefenseRecommendationRepository.class);
        controlRepository = Mockito.mock(DefenseControlRepository.class);
        evidenceRepository = Mockito.mock(DefenseEvidenceRepository.class);
        findingDefenseControlRepository = Mockito.mock(FindingDefenseControlRepository.class);
        planRepository = Mockito.mock(RemediationPlanRepository.class);
        taskRepository = Mockito.mock(RemediationTaskRepository.class);
        validationPlanRepository = Mockito.mock(DefenseValidationPlanRepository.class);
        auditService = Mockito.mock(AuditService.class);

        defenseService = new DefenseService(
                recommendationRepository,
                evidenceRepository,
                controlRepository,
                findingDefenseControlRepository,
                planRepository,
                taskRepository,
                validationPlanRepository,
                findingRepository,
                defenseEngine,
                auditService,
                null, // No LLM for deterministic rule tests
                new ObjectMapper()
        );
    }

    @Test
    @DisplayName("Deterministic Mapping: SQL Injection finding maps to DB-QUERY-001 control & UNSAFE_QUERY_CONSTRUCTION root cause")
    void testSqlInjectionDefenseMapping() {
        SecurityFinding finding = SecurityFinding.builder()
                .id(UUID.randomUUID())
                .title("SQL Injection vulnerability in login endpoint")
                .description("Parameter username is concatenated into raw database SQL query")
                .findingType(FindingType.WEB_APPLICATION_ALERT)
                .severity(FindingSeverity.CRITICAL)
                .build();

        DefenseEngine.AnalysisResult result = defenseEngine.analyzeFinding(finding);

        assertNotNull(result);
        assertEquals("UNSAFE_QUERY_CONSTRUCTION", result.getRecommendation().getRootCause());
        assertEquals("CRITICAL", result.getRecommendation().getPriority());
        assertTrue(result.getControlMappings().stream().anyMatch(c -> "DB-QUERY-001".equals(c.getControlCode())));
        assertNotNull(result.getValidationPlan());
    }

    @Test
    @DisplayName("Deterministic Mapping: Missing HSTS header maps to HTTP-SEC-001 control & INSECURE_CONFIGURATION root cause")
    void testHstsDefenseMapping() {
        SecurityFinding finding = SecurityFinding.builder()
                .id(UUID.randomUUID())
                .title("Missing Strict-Transport-Security Header")
                .description("HTTPS endpoint is missing HSTS header max-age directive")
                .findingType(FindingType.SECURITY_HEADER)
                .severity(FindingSeverity.MEDIUM)
                .build();

        DefenseEngine.AnalysisResult result = defenseEngine.analyzeFinding(finding);

        assertNotNull(result);
        assertEquals("INSECURE_CONFIGURATION", result.getRecommendation().getRootCause());
        assertEquals("MEDIUM", result.getRecommendation().getPriority());
        assertTrue(result.getControlMappings().stream().anyMatch(c -> "HTTP-SEC-001".equals(c.getControlCode())));
    }

    @Test
    @DisplayName("Defense Service End-to-End Generation & Review Workflow")
    void testDefenseGenerationAndReview() {
        UUID findingId = UUID.randomUUID();
        SecurityFinding finding = SecurityFinding.builder()
                .id(findingId)
                .title("Cross-Site Scripting (XSS)")
                .description("Unescaped user input rendered in HTML DOM")
                .findingType(FindingType.WEB_APPLICATION_ALERT)
                .severity(FindingSeverity.HIGH)
                .build();

        when(findingRepository.findById(findingId)).thenReturn(Optional.of(finding));
        when(recommendationRepository.save(any(DefenseRecommendation.class))).thenAnswer(inv -> {
            DefenseRecommendation r = inv.getArgument(0);
            if (r.getId() == null) r.setId(UUID.randomUUID());
            return r;
        });
        when(validationPlanRepository.save(any(DefenseValidationPlan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(validationPlanRepository.findByRecommendationId(any())).thenAnswer(inv -> {
            UUID recId = inv.getArgument(0);
            DefenseValidationPlan plan = DefenseValidationPlan.builder()
                    .recommendationId(recId)
                    .planTitle("Validation Plan")
                    .validationStepsJson("[\"Step 1\",\"Step 2\"]")
                    .verificationBoundary("Retest Boundary")
                    .build();
            return Optional.of(plan);
        });

        GenerateRecommendationRequest req = new GenerateRecommendationRequest();
        req.setFindingId(findingId);
        req.setUseAiAnalysis(false);

        DefenseRecommendationResponseDto dto = defenseService.generateRecommendation(req, "test-user");

        assertNotNull(dto);
        assertEquals("PROPOSED", dto.getStatus());
        assertEquals("HIGH", dto.getPriority());
        assertNotNull(dto.getValidationPlan());
    }
}
