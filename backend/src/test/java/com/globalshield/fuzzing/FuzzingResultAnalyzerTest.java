package com.globalshield.fuzzing;

import com.globalshield.finding.entity.FindingConfidence;
import com.globalshield.fuzzing.analysis.FuzzingAnalysisResult;
import com.globalshield.fuzzing.analysis.FuzzingResultAnalyzer;
import com.globalshield.fuzzing.entity.FuzzingTestCase;
import com.globalshield.fuzzing.entity.TestResultClassification;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class FuzzingResultAnalyzerTest {

    private FuzzingResultAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new FuzzingResultAnalyzer();
    }

    @Test
    void testSqlSyntaxErrorDetection() {
        FuzzingTestCase tc = FuzzingTestCase.builder()
                .parameterName("id")
                .payloadType("SQL_INJECTION_SYNTAX")
                .testPayload("'")
                .build();

        String errorBody = "{\"error\": \"org.postgresql.util.PSQLException: ERROR: syntax error at or near 'SELECT'\"}";

        FuzzingAnalysisResult res = analyzer.analyzeResponse(
                tc, 500, "Content-Type: application/json", errorBody, 120, 200, "{\"id\":1}"
        );

        assertEquals(TestResultClassification.VULNERABILITY_CONFIRMED, res.getClassification());
        assertEquals(FindingConfidence.HIGH, res.getConfidence());
        assertTrue(res.isFindingWarranted());
        assertTrue(res.getFindingTitle().contains("SQL Injection"));
    }

    @Test
    void testXssCanaryReflectionDetection() {
        String canary = "<gs_canary_test123>";
        FuzzingTestCase tc = FuzzingTestCase.builder()
                .parameterName("q")
                .payloadType("XSS_REFLECTION_CANARY")
                .testPayload(canary)
                .build();

        String htmlBody = "<html><body>Results for " + canary + "</body></html>";

        FuzzingAnalysisResult res = analyzer.analyzeResponse(
                tc, 200, "Content-Type: text/html", htmlBody, 80, 200, "<html><body>Results for test</body></html>"
        );

        assertEquals(TestResultClassification.VULNERABILITY_CONFIRMED, res.getClassification());
        assertTrue(res.isFindingWarranted());
        assertTrue(res.getFindingTitle().contains("Cross-Site Scripting"));
    }

    @Test
    void testPathTraversalContentLeakDetection() {
        FuzzingTestCase tc = FuzzingTestCase.builder()
                .parameterName("file")
                .payloadType("PATH_TRAVERSAL_UNIX")
                .testPayload("../../../../etc/passwd")
                .build();

        String leakedBody = "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin";

        FuzzingAnalysisResult res = analyzer.analyzeResponse(
                tc, 200, "Content-Type: text/plain", leakedBody, 50, 200, "hello"
        );

        assertEquals(TestResultClassification.VULNERABILITY_CONFIRMED, res.getClassification());
        assertEquals(FindingConfidence.VERY_HIGH, res.getConfidence());
        assertTrue(res.isFindingWarranted());
    }

    @Test
    void testProperlyRejectedInputClassifiesAsPassed() {
        FuzzingTestCase tc = FuzzingTestCase.builder()
                .parameterName("q")
                .payloadType("SQL_INJECTION_SYNTAX")
                .testPayload("'")
                .build();

        // 400 Bad Request with generic message
        String safeBody = "{\"status\": 400, \"message\": \"Invalid parameter format\"}";

        FuzzingAnalysisResult res = analyzer.analyzeResponse(
                tc, 400, "Content-Type: application/json", safeBody, 45, 200, "{\"status\": 200}"
        );

        assertEquals(TestResultClassification.PASSED, res.getClassification());
        assertFalse(res.isFindingWarranted());
    }
}
