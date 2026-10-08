package com.globalshield;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.assessment.result.AssessmentObservationRepository;
import com.globalshield.assessment.result.ObservationSeverity;
import com.globalshield.attacksurface.repository.AttackSurfaceAssetRepository;
import com.globalshield.attacksurface.repository.WebEndpointRepository;
import com.globalshield.finding.entity.*;
import com.globalshield.finding.repository.*;
import com.globalshield.finding.service.FindingNormalizationService;
import com.globalshield.target.SecurityTarget;
import com.globalshield.vulnerability.service.VulnerabilityIntelligenceProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FindingNormalizationServiceTest {

    @Mock
    private SecurityAssessmentRepository assessmentRepository;
    @Mock
    private AssessmentObservationRepository rawObservationRepository;
    @Mock
    private SecurityFindingRepository findingRepository;
    @Mock
    private FindingEvidenceRepository evidenceRepository;
    @Mock
    private FindingReferenceRepository referenceRepository;
    @Mock
    private AttackSurfaceAssetRepository assetRepository;
    @Mock
    private WebEndpointRepository endpointRepository;
    @Mock
    private VulnerabilityIntelligenceProvider intelligenceProvider;

    @InjectMocks
    private FindingNormalizationService normalizationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testFindingNormalizationAndRedaction() {
        UUID assessmentId = UUID.randomUUID();
        SecurityTarget target = SecurityTarget.builder().primaryUrl("https://example.com").name("Test Target").build();
        SecurityAssessment assessment = SecurityAssessment.builder().id(assessmentId).target(target).build();

        AssessmentObservation rawObs = AssessmentObservation.builder()
                .category("HTTP_SECURITY_ANALYSIS")
                .title("Missing HSTS Header")
                .description("HSTS is missing from response")
                .severity(ObservationSeverity.MEDIUM)
                .source("HTTP_ANALYSIS")
                .evidence("Authorization: Bearer secret_jwt_token_12345")
                .build();

        when(assessmentRepository.findById(assessmentId)).thenReturn(Optional.of(assessment));
        when(rawObservationRepository.findByAssessmentId(assessmentId)).thenReturn(List.of(rawObs));
        when(findingRepository.findByAssessmentIdAndDeduplicationHash(any(), any())).thenReturn(Optional.empty());
        when(findingRepository.save(any())).thenAnswer(invocation -> {
            SecurityFinding f = invocation.getArgument(0);
            f.setId(UUID.randomUUID());
            return f;
        });

        normalizationService.processAssessmentFindings(assessmentId);

        ArgumentCaptor<FindingEvidence> evidenceCaptor = ArgumentCaptor.forClass(FindingEvidence.class);
        verify(evidenceRepository, times(1)).save(evidenceCaptor.capture());

        FindingEvidence savedEv = evidenceCaptor.getValue();
        assertNotNull(savedEv);
        assertTrue(savedEv.getRedactedContent().contains("[REDACTED]"));
        assertFalse(savedEv.getRedactedContent().contains("secret_jwt_token_12345"));
    }
}
