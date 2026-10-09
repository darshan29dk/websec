package com.globalshield.fuzzing.payload;

import com.globalshield.fuzzing.entity.FuzzingProfile;
import com.globalshield.fuzzing.entity.OwaspCategory;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class FuzzingPayloadProvider {

    public List<FuzzingPayload> getPayloadsForProfile(FuzzingProfile profile, List<String> requestedCategories) {
        List<FuzzingPayload> allPayloads = new ArrayList<>();

        // 1. OWASP A03: Injection (SQLi, Polyglot XSS, CRLF)
        if (isCategoryEnabled(requestedCategories, "A03", "OWASP_A03_INJECTION", "INJECTION")) {
            allPayloads.addAll(getInjectionPayloads());
        }

        // 2. OWASP A01: Broken Access Control & Path Traversal
        if (isCategoryEnabled(requestedCategories, "A01", "OWASP_A01_ACCESS_CONTROL", "ACCESS_CONTROL")) {
            allPayloads.addAll(getAccessControlPayloads());
        }

        // 3. OWASP A05: Security Misconfiguration
        if (isCategoryEnabled(requestedCategories, "A05", "OWASP_A05_CONFIG", "CONFIGURATION")) {
            allPayloads.addAll(getMisconfigurationPayloads());
        }

        // 4. OWASP A07: Identification and Authentication Failures
        if (isCategoryEnabled(requestedCategories, "A07", "OWASP_A07_AUTH", "AUTHENTICATION")) {
            allPayloads.addAll(getAuthenticationPayloads());
        }

        // 5. OWASP A10: Server-Side Request Forgery
        if (isCategoryEnabled(requestedCategories, "A10", "OWASP_A10_SSRF", "SSRF")) {
            allPayloads.addAll(getSsrfPayloads());
        }

        // 6. REST API Schema & Type-Confusion Probes
        if (profile == FuzzingProfile.API_PARAMETER_MUTATION || isCategoryEnabled(requestedCategories, "API", "SCHEMA", "REST_API")) {
            allPayloads.addAll(getApiSchemaPayloads());
        }

        // Profile adjustments
        if (profile == FuzzingProfile.PASSIVE_BASELINE) {
            // Only non-mutating boundary baseline checks
            return allPayloads.stream()
                    .filter(p -> p.getPayloadType().contains("BASELINE") || p.getPayloadType().contains("CONFIG"))
                    .toList();
        }

        return allPayloads;
    }

    private boolean isCategoryEnabled(List<String> requested, String code, String alt1, String alt2) {
        if (requested == null || requested.isEmpty()) {
            return true; // All enabled by default
        }
        return requested.stream().anyMatch(cat ->
                cat.equalsIgnoreCase(code) ||
                cat.equalsIgnoreCase(alt1) ||
                cat.equalsIgnoreCase(alt2) ||
                cat.toUpperCase().contains(code)
        );
    }

    private List<FuzzingPayload> getInjectionPayloads() {
        String canaryToken = "gs_" + UUID.randomUUID().toString().substring(0, 8);
        return List.of(
                FuzzingPayload.builder()
                        .name("SQL Syntax Error Probe (Single Quote)")
                        .payloadType("SQL_INJECTION_SYNTAX")
                        .owaspCategory(OwaspCategory.A03)
                        .testValue("'")
                        .baselineValue("1")
                        .description("Tests whether unescaped single quotation produces SQL syntax errors or database exception leak")
                        .detectionSignature("SQLSTATE|syntax error|ORA-|PostgreSQL|SQLite|MySQL|syntax error in SQL")
                        .build(),
                FuzzingPayload.builder()
                        .name("SQL Boolean Logic True Probe")
                        .payloadType("SQL_INJECTION_BOOLEAN_TRUE")
                        .owaspCategory(OwaspCategory.A03)
                        .testValue("' OR '1'='1")
                        .baselineValue("1")
                        .description("Evaluates boolean tautology handling in parameter parsing")
                        .detectionSignature("SQLSTATE|syntax error")
                        .build(),
                FuzzingPayload.builder()
                        .name("SQL Boolean Logic False Probe")
                        .payloadType("SQL_INJECTION_BOOLEAN_FALSE")
                        .owaspCategory(OwaspCategory.A03)
                        .testValue("' OR '1'='2")
                        .baselineValue("1")
                        .description("Evaluates differential response behavior for false boolean predicate")
                        .detectionSignature("SQLSTATE|syntax error")
                        .build(),
                FuzzingPayload.builder()
                        .name("XSS HTML Reflection Canary Probe")
                        .payloadType("XSS_REFLECTION_CANARY")
                        .owaspCategory(OwaspCategory.A03)
                        .testValue("<" + canaryToken + ">")
                        .baselineValue("test")
                        .description("Submits benign HTML tag canary to verify whether output is escaped or reflected raw")
                        .detectionSignature("<" + canaryToken + ">")
                        .build(),
                FuzzingPayload.builder()
                        .name("CRLF Header Injection Canary")
                        .payloadType("HEADER_INJECTION_CRLF")
                        .owaspCategory(OwaspCategory.A03)
                        .testValue("%0d%0aX-GlobalShield-Canary:true")
                        .baselineValue("normal")
                        .description("Tests whether newline characters inject arbitrary HTTP response headers")
                        .detectionSignature("X-GlobalShield-Canary")
                        .build()
        );
    }

    private List<FuzzingPayload> getAccessControlPayloads() {
        return List.of(
                FuzzingPayload.builder()
                        .name("Path Traversal Unix Shadow/Passwd Read Probe")
                        .payloadType("PATH_TRAVERSAL_UNIX")
                        .owaspCategory(OwaspCategory.A01)
                        .testValue("../../../../etc/passwd")
                        .baselineValue("index.html")
                        .description("Safe probe checking for directory traversal to system files")
                        .detectionSignature("root:x:0:0:")
                        .build(),
                FuzzingPayload.builder()
                        .name("Path Traversal Windows INI Read Probe")
                        .payloadType("PATH_TRAVERSAL_WINDOWS")
                        .owaspCategory(OwaspCategory.A01)
                        .testValue("..\\..\\..\\..\\windows\\win.ini")
                        .baselineValue("index.html")
                        .description("Safe probe checking for directory traversal to Windows system files")
                        .detectionSignature("\\[extensions\\]|\\[fonts\\]")
                        .build(),
                FuzzingPayload.builder()
                        .name("Bypass Web-INF Traversal Probe")
                        .payloadType("PATH_TRAVERSAL_WEBINF")
                        .owaspCategory(OwaspCategory.A01)
                        .testValue("../WEB-INF/web.xml")
                        .baselineValue("index.html")
                        .description("Safe probe checking for access to application deployment descriptor")
                        .detectionSignature("<web-app")
                        .build()
        );
    }

    private List<FuzzingPayload> getMisconfigurationPayloads() {
        return List.of(
                FuzzingPayload.builder()
                        .name("Malformed JSON Body Trigger")
                        .payloadType("CONFIG_MALFORMED_JSON")
                        .owaspCategory(OwaspCategory.A05)
                        .testValue("{\"unclosed_json\": true, ")
                        .baselineValue("{\"test\": true}")
                        .description("Evaluates how the server handles syntax errors in JSON bodies without leaking stack traces")
                        .detectionSignature("Exception in thread|at com\\.|at org\\.|Traceback \\(most recent call")
                        .build(),
                FuzzingPayload.builder()
                        .name("Boundary Overflow String Probe")
                        .payloadType("CONFIG_BOUNDARY_OVERFLOW")
                        .owaspCategory(OwaspCategory.A05)
                        .testValue("A".repeat(4096))
                        .baselineValue("test")
                        .description("Bounded 4KB buffer probe to inspect server boundary checking")
                        .detectionSignature("BufferOverflow|MemoryError|Core Dump|NullPointerException")
                        .build()
        );
    }

    private List<FuzzingPayload> getAuthenticationPayloads() {
        return List.of(
                FuzzingPayload.builder()
                        .name("Invalid JWT Signature Token")
                        .payloadType("AUTH_INVALID_TOKEN")
                        .owaspCategory(OwaspCategory.A07)
                        .testValue("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature_canary")
                        .baselineValue("Bearer valid_token")
                        .description("Verifies that forged JWT signatures are strictly rejected with 401")
                        .detectionSignature("HTTP/1.1 200 OK")
                        .build(),
                FuzzingPayload.builder()
                        .name("Missing Authentication Header")
                        .payloadType("AUTH_MISSING_HEADER")
                        .owaspCategory(OwaspCategory.A07)
                        .testValue("")
                        .baselineValue("Bearer valid_token")
                        .description("Verifies protected endpoints require valid authentication credentials")
                        .detectionSignature("200 OK")
                        .build()
        );
    }

    private List<FuzzingPayload> getSsrfPayloads() {
        return List.of(
                FuzzingPayload.builder()
                        .name("SSRF Internal Host Canary")
                        .payloadType("SSRF_INTERNAL_CANARY")
                        .owaspCategory(OwaspCategory.A10)
                        .testValue("http://127.0.0.1:80/internal_canary")
                        .baselineValue("http://example.com")
                        .description("Safe loopback probe to detect unvalidated URL fetching")
                        .detectionSignature("127.0.0.1|internal_canary|Apache|nginx|Server:")
                        .build()
        );
    }

    public List<FuzzingPayload> getApiSchemaPayloads() {
        return List.of(
                FuzzingPayload.builder()
                        .name("API Schema Type Confusion (String to Int)")
                        .payloadType("API_TYPE_CONFUSION")
                        .owaspCategory(OwaspCategory.A05)
                        .testValue("NOT_A_VALID_NUMBER")
                        .baselineValue("1")
                        .description("Sends invalid string type into numeric schema parameter")
                        .detectionSignature("java.lang.NumberFormatException|type mismatch|expected integer|validation error")
                        .build(),
                FuzzingPayload.builder()
                        .name("API Boundary Integer Overflow")
                        .payloadType("API_INTEGER_OVERFLOW")
                        .owaspCategory(OwaspCategory.A05)
                        .testValue("9223372036854775808")
                        .baselineValue("10")
                        .description("Sends 64-bit integer overflow into numeric parameter")
                        .detectionSignature("ArithmeticException|overflow|out of range")
                        .build(),
                FuzzingPayload.builder()
                        .name("API Null Parameter Injection")
                        .payloadType("API_NULL_INJECTION")
                        .owaspCategory(OwaspCategory.A05)
                        .testValue("null")
                        .baselineValue("standard_value")
                        .description("Sends literal null into required schema property")
                        .detectionSignature("NullPointerException|cannot be null|required field")
                        .build(),
                FuzzingPayload.builder()
                        .name("API JSON Array Type Confusion")
                        .payloadType("API_ARRAY_TYPE_CONFUSION")
                        .owaspCategory(OwaspCategory.A05)
                        .testValue("[\"unexpected\", \"array\"]")
                        .baselineValue("single_scalar_value")
                        .description("Sends JSON array into scalar property to test unhandled parser exceptions")
                        .detectionSignature("Cannot deserialize|JsonMappingException|syntax error")
                        .build()
        );
    }
}
