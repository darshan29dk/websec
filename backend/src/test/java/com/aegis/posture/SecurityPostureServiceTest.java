package com.aegis.posture;

import com.aegis.assessment.AssessmentStatus;
import com.aegis.assessment.SecurityAssessment;
import com.aegis.finding.entity.FindingConfidence;
import com.aegis.finding.entity.FindingSeverity;
import com.aegis.finding.entity.FindingStatus;
import com.aegis.finding.entity.SecurityFinding;
import com.aegis.posture.entity.*;
import com.aegis.posture.service.*;
import com.aegis.target.SecurityTarget;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SecurityPostureServiceTest {

    private FindingFingerprintService fingerprintService;
    private PostureDimensionCalculator dimensionCalculator;
    private SecurityScoreCalculator scoreCalculator;

    @BeforeEach
    void setUp() {
        fingerprintService = new FindingFingerprintService();
        dimensionCalculator = new PostureDimensionCalculator();
        scoreCalculator = new SecurityScoreCalculator();
    }

    @Test
    @DisplayName("Fingerprint generation should be deterministic and normalized")
    void testFindingFingerprintConsistency() {
        String fp1 = fingerprintService.computeFingerprint("https://example.com/", "/api/users/", "GET", "id", "SQL_INJECTION", "CWE-89");
        String fp2 = fingerprintService.computeFingerprint("https://example.com", "/api/users", "get", "id", "sql_injection", "CWE-89");

        assertNotNull(fp1);
        assertEquals(64, fp1.length());
        assertEquals(fp1, fp2, "Fingerprints must match regardless of casing or trailing slashes");
    }

    @Test
    @DisplayName("Score calculator should assign correct risk levels based on score")
    void testDetermineRiskLevel() {
        assertEquals(PostureRiskLevel.EXCELLENT, scoreCalculator.determineRiskLevel(95));
        assertEquals(PostureRiskLevel.GOOD, scoreCalculator.determineRiskLevel(80));
        assertEquals(PostureRiskLevel.MODERATE, scoreCalculator.determineRiskLevel(68));
        assertEquals(PostureRiskLevel.HIGH_RISK, scoreCalculator.determineRiskLevel(50));
        assertEquals(PostureRiskLevel.CRITICAL_RISK, scoreCalculator.determineRiskLevel(20));
    }

    @Test
    @DisplayName("Vulnerability risk calculation with critical findings")
    void testVulnerabilityRiskCalculation() {
        var evidence = PostureEvidenceCollector.TargetPostureEvidence.builder()
            .targetId(UUID.randomUUID())
            .criticalOpenCount(1)
            .highOpenCount(2)
            .mediumOpenCount(3)
            .lowOpenCount(1)
            .fixedCount(2)
            .assetCount(2)
            .endpointCount(5)
            .hasSufficientData(true)
            .build();

        var dimensions = dimensionCalculator.calculateAllDimensions(evidence);
        assertNotNull(dimensions);
        assertEquals(6, dimensions.size());

        var vulnRisk = dimensions.stream()
            .filter(d -> d.getDimension() == PostureDimensionType.VULNERABILITY_RISK)
            .findFirst()
            .orElseThrow();

        assertEquals(PostureStatus.VALID, vulnRisk.getStatus());
        assertTrue(vulnRisk.getScore() < 100, "Score should be penalized for unresolved findings");
    }

    @Test
    @DisplayName("Insufficient data should result in INSUFFICIENT_DATA status")
    void testInsufficientDataScore() {
        var evidence = PostureEvidenceCollector.TargetPostureEvidence.builder()
            .targetId(UUID.randomUUID())
            .hasSufficientData(false)
            .build();

        var dimensions = dimensionCalculator.calculateAllDimensions(evidence);
        var scoreResult = scoreCalculator.calculateOverallScore(dimensions, false);

        assertEquals(PostureStatus.INSUFFICIENT_DATA, scoreResult.getScoreStatus());
        assertEquals(PostureRiskLevel.INSUFFICIENT_DATA, scoreResult.getRiskLevel());
    }
}
