package com.aegis.retest;

import com.aegis.finding.entity.SecurityFinding;
import com.aegis.retest.entity.*;
import com.aegis.retest.service.ValidationDecisionEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ValidationDecisionEngineTest {

    private ValidationDecisionEngine decisionEngine;
    private SecurityFinding mockFinding;

    @BeforeEach
    void setUp() {
        decisionEngine = new ValidationDecisionEngine();
        mockFinding = new SecurityFinding();
        mockFinding.setId(UUID.randomUUID());
        mockFinding.setTitle("Missing Strict-Transport-Security Header");
        mockFinding.setDescription("HTTP response lacks HSTS header.");
    }

    @Test
    @DisplayName("Should return FIXED when all retest checks pass")
    void testFixedDecision() {
        RetestCheck check = RetestCheck.builder()
                .uuid(UUID.randomUUID().toString())
                .checkType(RetestCheckType.HEADER_VALIDATION)
                .toolName("AEGIS Header Checker")
                .expectedCondition("Strict-Transport-Security header present")
                .status(RetestCheckStatus.PASSED)
                .build();

        String beforeData = "HTTP/1.1 200 OK\nServer: nginx";
        String afterData = "HTTP/1.1 200 OK\nStrict-Transport-Security: max-age=31536000; includeSubDomains\nX-Content-Type-Options: nosniff";

        ValidationDecisionEngine.DecisionOutput output = decisionEngine.evaluate(
                mockFinding, beforeData, afterData, List.of(check), Collections.emptyList()
        );

        assertEquals(ValidationStatus.FIXED, output.getStatus());
        assertEquals(ValidationConfidence.HIGH, output.getConfidence());
        assertTrue(output.getSummary().contains("satisfied expected security conditions"));
        assertEquals(1, output.getResults().size());
        assertEquals(ValidationResultType.EXPECTED, output.getResults().get(0).getResultType());
    }

    @Test
    @DisplayName("Should return NOT_FIXED when retest check fails")
    void testNotFixedDecision() {
        RetestCheck check = RetestCheck.builder()
                .uuid(UUID.randomUUID().toString())
                .checkType(RetestCheckType.HEADER_VALIDATION)
                .toolName("AEGIS Header Checker")
                .expectedCondition("Strict-Transport-Security header present")
                .status(RetestCheckStatus.FAILED)
                .build();

        String beforeData = "HTTP/1.1 200 OK\nServer: nginx";
        String afterData = "HTTP/1.1 200 OK\nServer: nginx\n(Missing HSTS)";

        ValidationDecisionEngine.DecisionOutput output = decisionEngine.evaluate(
                mockFinding, beforeData, afterData, List.of(check), Collections.emptyList()
        );

        assertEquals(ValidationStatus.NOT_FIXED, output.getStatus());
        assertEquals(ValidationConfidence.HIGH, output.getConfidence());
        assertTrue(output.getSummary().contains("Remediation incomplete"));
    }

    @Test
    @DisplayName("Should return REGRESSED when a previously FIXED finding fails retest")
    void testRegressedDecision() {
        RetestCheck check = RetestCheck.builder()
                .uuid(UUID.randomUUID().toString())
                .checkType(RetestCheckType.HEADER_VALIDATION)
                .toolName("AEGIS Header Checker")
                .expectedCondition("Strict-Transport-Security header present")
                .status(RetestCheckStatus.FAILED)
                .build();

        DefenseValidation pastValidation = DefenseValidation.builder()
                .validationStatus(ValidationStatus.FIXED)
                .validatedAt(OffsetDateTime.now().minusDays(5))
                .build();

        String beforeData = "HTTP/1.1 200 OK\nServer: nginx";
        String afterData = "HTTP/1.1 200 OK\nServer: nginx\n(HSTS removed again)";

        ValidationDecisionEngine.DecisionOutput output = decisionEngine.evaluate(
                mockFinding, beforeData, afterData, List.of(check), List.of(pastValidation)
        );

        assertEquals(ValidationStatus.REGRESSED, output.getStatus());
        assertEquals(ValidationConfidence.HIGH, output.getConfidence());
        assertTrue(output.getSummary().contains("REGRESSION DETECTED"));
    }

    @Test
    @DisplayName("Should return PARTIALLY_FIXED when some checks pass and others fail")
    void testPartiallyFixedDecision() {
        RetestCheck check1 = RetestCheck.builder()
                .uuid(UUID.randomUUID().toString())
                .checkType(RetestCheckType.COOKIE_VALIDATION)
                .toolName("AEGIS Cookie Checker")
                .expectedCondition("Secure flag present")
                .status(RetestCheckStatus.PASSED)
                .build();

        RetestCheck check2 = RetestCheck.builder()
                .uuid(UUID.randomUUID().toString())
                .checkType(RetestCheckType.COOKIE_VALIDATION)
                .toolName("AEGIS Cookie Checker")
                .expectedCondition("HttpOnly flag present")
                .status(RetestCheckStatus.FAILED)
                .build();

        String beforeData = "Set-Cookie: session=xyz";
        String afterData = "Set-Cookie: session=xyz; Secure";

        ValidationDecisionEngine.DecisionOutput output = decisionEngine.evaluate(
                mockFinding, beforeData, afterData, List.of(check1, check2), Collections.emptyList()
        );

        assertEquals(ValidationStatus.PARTIALLY_FIXED, output.getStatus());
        assertEquals(ValidationConfidence.MEDIUM, output.getConfidence());
        assertTrue(output.getSummary().contains("Partial remediation"));
    }

    @Test
    @DisplayName("Should return INCONCLUSIVE when tool is unavailable or network error occurs")
    void testInconclusiveDecision() {
        RetestCheck check = RetestCheck.builder()
                .uuid(UUID.randomUUID().toString())
                .checkType(RetestCheckType.ENDPOINT_REACHABILITY_VALIDATION)
                .toolName("AEGIS HTTP Checker")
                .expectedCondition("Endpoint reachable")
                .status(RetestCheckStatus.ERROR)
                .build();

        String beforeData = "Baseline data";
        String afterData = "ERROR: Connection refused";

        ValidationDecisionEngine.DecisionOutput output = decisionEngine.evaluate(
                mockFinding, beforeData, afterData, List.of(check), Collections.emptyList()
        );

        assertEquals(ValidationStatus.INCONCLUSIVE, output.getStatus());
        assertEquals(ValidationConfidence.LOW, output.getConfidence());
        assertTrue(output.getSummary().contains("inconclusive"));
    }
}
