package com.globalshield.fuzzing.analysis;

import com.globalshield.finding.entity.FindingConfidence;
import com.globalshield.fuzzing.entity.FuzzingTestCase;
import com.globalshield.fuzzing.entity.TestResultClassification;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class FuzzingResultAnalyzer {

    private static final Pattern SQL_ERROR_PATTERN = Pattern.compile(
            "(SQLSTATE|syntax error in SQL|syntax error.*SELECT|ORA-\\d{5}|pg_catalog|sqlite3\\.OperationalError|MySQL server version|ODBC Driver)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern STACK_TRACE_PATTERN = Pattern.compile(
            "(Exception in thread|NullPointerException|ArrayIndexOutOfBounds|Traceback \\(most recent call|Fatal error:.*in /|at org\\.springframework\\.|at com\\.)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern LFI_PATTERN = Pattern.compile(
            "(root:x:0:0:|\\[extensions\\]|\\[fonts\\]|<web-app|daemon:x:|bin:x:)",
            Pattern.CASE_INSENSITIVE
    );

    public FuzzingAnalysisResult analyzeResponse(
            FuzzingTestCase testCase,
            int testStatus,
            String testHeaders,
            String testBody,
            long responseTimeMs,
            Integer baselineStatus,
            String baselineBody
    ) {
        String payloadType = testCase.getPayloadType() != null ? testCase.getPayloadType() : "";
        String testPayload = testCase.getTestPayload() != null ? testCase.getTestPayload() : "";
        String safeBody = testBody != null ? testBody : "";
        String safeHeaders = testHeaders != null ? testHeaders : "";

        // 1. Direct Exploit / Proof of Vulnerability Signatures
        // LFI / Path Traversal Match
        if (payloadType.startsWith("PATH_TRAVERSAL") && LFI_PATTERN.matcher(safeBody).find()) {
            return FuzzingAnalysisResult.builder()
                    .classification(TestResultClassification.VULNERABILITY_CONFIRMED)
                    .confidence(FindingConfidence.VERY_HIGH)
                    .diffSummary("Known OS system file content observed in HTTP response body")
                    .anomalyDetails("File content signature matched: system file leaked via parameter " + testCase.getParameterName())
                    .findingWarranted(true)
                    .findingTitle("Path Traversal / Arbitrary File Read via " + testCase.getParameterName())
                    .findingDescription("Endpoint returned system file markers when tested with safe traversal sequence: " + testPayload)
                    .findingSeverity("CRITICAL")
                    .build();
        }

        // Header Injection Reflection Match
        if (payloadType.equals("HEADER_INJECTION_CRLF") && safeHeaders.contains("X-GlobalShield-Canary")) {
            return FuzzingAnalysisResult.builder()
                    .classification(TestResultClassification.VULNERABILITY_CONFIRMED)
                    .confidence(FindingConfidence.VERY_HIGH)
                    .diffSummary("Injected response header X-GlobalShield-Canary observed in HTTP response headers")
                    .anomalyDetails("CRLF header injection successful on parameter " + testCase.getParameterName())
                    .findingWarranted(true)
                    .findingTitle("CRLF / HTTP Response Splitting in " + testCase.getParameterName())
                    .findingDescription("Server reflected custom HTTP headers injected into request parameter " + testCase.getParameterName())
                    .findingSeverity("HIGH")
                    .build();
        }

        // XSS Raw HTML Reflection Match
        if (payloadType.equals("XSS_REFLECTION_CANARY") && safeBody.contains(testPayload)) {
            return FuzzingAnalysisResult.builder()
                    .classification(TestResultClassification.VULNERABILITY_CONFIRMED)
                    .confidence(FindingConfidence.HIGH)
                    .diffSummary("Unescaped HTML canary marker reflected directly in response body")
                    .anomalyDetails("Reflected HTML canary found unencoded: " + testPayload)
                    .findingWarranted(true)
                    .findingTitle("Reflected Cross-Site Scripting (XSS) in " + testCase.getParameterName())
                    .findingDescription("Server returned unescaped HTML canary tags in HTTP response body for parameter " + testCase.getParameterName())
                    .findingSeverity("HIGH")
                    .build();
        }

        // SQL Injection Syntax Error Match
        if (payloadType.startsWith("SQL_INJECTION") && SQL_ERROR_PATTERN.matcher(safeBody).find()) {
            return FuzzingAnalysisResult.builder()
                    .classification(TestResultClassification.VULNERABILITY_CONFIRMED)
                    .confidence(FindingConfidence.HIGH)
                    .diffSummary("Database error or SQL syntax disclosure observed in response")
                    .anomalyDetails("SQL database error pattern detected when injecting: " + testPayload)
                    .findingWarranted(true)
                    .findingTitle("SQL Injection Syntax Error Exposure in " + testCase.getParameterName())
                    .findingDescription("Input of SQL delimiter produced database syntax error disclosure in response body.")
                    .findingSeverity("HIGH")
                    .build();
        }

        // 2. Suspicious Behaviors Requiring Manual Review
        // HTTP 500 with stack trace
        if (testStatus == 500 && STACK_TRACE_PATTERN.matcher(safeBody).find()) {
            return FuzzingAnalysisResult.builder()
                    .classification(TestResultClassification.SUSPICIOUS)
                    .confidence(FindingConfidence.MEDIUM)
                    .diffSummary("HTTP 500 Internal Server Error with application stack trace disclosure")
                    .anomalyDetails("Unhandled exception leaked application stack trace on parameter: " + testCase.getParameterName())
                    .findingWarranted(true)
                    .findingTitle("Verbose Error / Stack Trace Disclosure on " + testCase.getParameterName())
                    .findingDescription("Server threw unhandled 500 error leaking stack trace upon receiving fuzzed input.")
                    .findingSeverity("LOW")
                    .build();
        }

        // Authentication bypass indicator (sent invalid auth, but got 200 OK)
        if (payloadType.startsWith("AUTH_") && testStatus == 200 && (baselineStatus == null || baselineStatus != 200)) {
            return FuzzingAnalysisResult.builder()
                    .classification(TestResultClassification.SUSPICIOUS)
                    .confidence(FindingConfidence.MEDIUM)
                    .diffSummary("Endpoint returned HTTP 200 despite missing or invalid authentication token")
                    .anomalyDetails("Potential broken access control / missing authorization guard")
                    .findingWarranted(true)
                    .findingTitle("Potential Missing Authentication Enforcement on " + testCase.getTargetUrl())
                    .findingDescription("Endpoint returned HTTP 200 OK with test authentication payload: " + testPayload)
                    .findingSeverity("MEDIUM")
                    .build();
        }

        // General 500 without stack trace
        if (testStatus == 500) {
            return FuzzingAnalysisResult.builder()
                    .classification(TestResultClassification.SUSPICIOUS)
                    .confidence(FindingConfidence.LOW)
                    .diffSummary("Server returned HTTP 500 Internal Server Error")
                    .anomalyDetails("Server failure observed during test case execution; requires manual validation")
                    .findingWarranted(false)
                    .build();
        }

        // 3. Normal / Passed
        // 4xx responses (400, 401, 403, 404, 422) show the server correctly rejected invalid input
        String diff = "Server handled test input with HTTP " + testStatus;
        if (baselineStatus != null && !baselineStatus.equals(testStatus)) {
            diff += " (baseline was " + baselineStatus + ")";
        }

        return FuzzingAnalysisResult.builder()
                .classification(TestResultClassification.PASSED)
                .confidence(FindingConfidence.HIGH)
                .diffSummary(diff)
                .anomalyDetails("Input properly handled or sanitized by application")
                .findingWarranted(false)
                .build();
    }
}
