package com.aegis.defense.engine;

import com.aegis.defense.entity.DefenseControl;
import com.aegis.defense.entity.DefenseEvidence;
import com.aegis.defense.entity.DefenseRecommendation;
import com.aegis.defense.entity.DefenseValidationPlan;
import com.aegis.finding.entity.SecurityFinding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class DefenseEngine {

    private static final Logger log = LoggerFactory.getLogger(DefenseEngine.class);

    public static class AnalysisResult {
        private final DefenseRecommendation recommendation;
        private final List<DefenseControlMapping> controlMappings;
        private final List<DefenseEvidence> evidenceList;
        private final DefenseValidationPlan validationPlan;

        public AnalysisResult(DefenseRecommendation recommendation,
                              List<DefenseControlMapping> controlMappings,
                              List<DefenseEvidence> evidenceList,
                              DefenseValidationPlan validationPlan) {
            this.recommendation = recommendation;
            this.controlMappings = controlMappings;
            this.evidenceList = evidenceList;
            this.validationPlan = validationPlan;
        }

        public DefenseRecommendation getRecommendation() { return recommendation; }
        public List<DefenseControlMapping> getControlMappings() { return controlMappings; }
        public List<DefenseEvidence> getEvidenceList() { return evidenceList; }
        public DefenseValidationPlan getValidationPlan() { return validationPlan; }
    }

    public static class DefenseControlMapping {
        private final String controlCode;
        private final String relationship; // PRIMARY, SECONDARY, COMPENSATING

        public DefenseControlMapping(String controlCode, String relationship) {
            this.controlCode = controlCode;
            this.relationship = relationship;
        }

        public String getControlCode() { return controlCode; }
        public String getRelationship() { return relationship; }
    }

    public AnalysisResult analyzeFinding(SecurityFinding finding) {
        String title = finding.getTitle() != null ? finding.getTitle().toLowerCase() : "";
        String desc = finding.getDescription() != null ? finding.getDescription().toLowerCase() : "";
        String fullText = title + " " + desc;

        String rootCause;
        String rootCauseExplanation;
        String recType;
        String recTitle;
        String recSummary;
        String implGuidance;
        String compControls;
        String implRisks;
        List<DefenseControlMapping> controlMappings = new ArrayList<>();
        List<String> valSteps = new ArrayList<>();

        if (fullText.contains("sql") || fullText.contains("sqli") || fullText.contains("database injection")) {
            rootCause = "UNSAFE_QUERY_CONSTRUCTION";
            rootCauseExplanation = "Dynamic string concatenation was used when building database SQL queries, permitting un-sanitized input manipulation.";
            recType = "INPUT_VALIDATION";
            recTitle = "Remediate SQL Injection using Parameterized Queries & Input Validation";
            recSummary = "Replace dynamic string concatenation in database queries with parameterized statements (PreparedStatement) and enforce server-side allow-list validation.";
            implGuidance = "1. Identify dynamic SQL queries in code repository.\n2. Replace string building with parameterized query placeholders (? or :param).\n3. Apply server-side input validation on target parameters.\n4. Enforce least-privilege permissions on database application accounts.";
            compControls = "Deploy Web Application Firewall (WAF) SQLi inspection rules on the ingress gateway as a temporary compensating measure.";
            implRisks = "Changes to SQL query logic must be validated against existing application unit test suites to prevent performance regressions.";

            controlMappings.add(new DefenseControlMapping("DB-QUERY-001", "PRIMARY"));
            controlMappings.add(new DefenseControlMapping("APP-VAL-001", "SECONDARY"));

            valSteps.add("Re-run authorized security assessment targeted at endpoint.");
            valSteps.add("Submit single quote and SQL syntax injection payloads to affected parameters.");
            valSteps.add("Verify server returns expected HTTP response without SQL execution errors or data disclosure.");
            valSteps.add("Inspect database query execution logs to confirm parameterized query usage.");

        } else if (fullText.contains("xss") || fullText.contains("scripting") || fullText.contains("script injection")) {
            rootCause = "MISSING_INPUT_VALIDATION";
            rootCauseExplanation = "Unsanitized user-supplied input is rendered directly into HTML DOM contexts without context-aware output encoding.";
            recType = "OUTPUT_ENCODING";
            recTitle = "Remediate Cross-Site Scripting via Output Encoding & Content Security Policy";
            recSummary = "Implement context-aware HTML/JavaScript output encoding before rendering user data, and deploy a robust Content-Security-Policy (CSP).";
            implGuidance = "1. Apply framework output encoding (e.g. HTML entity escaping) for dynamic page variables.\n2. Configure Content-Security-Policy (CSP) response headers restricting script sources.\n3. Sanitize rich HTML inputs using an allow-list sanitizer library.";
            compControls = "Set HTTPOnly flag on session cookies to mitigate session hijacking via script injection.";
            implRisks = "Overly restrictive CSP policies could block legitimate external script dependencies if not thoroughly tested.";

            controlMappings.add(new DefenseControlMapping("APP-ENC-001", "PRIMARY"));
            controlMappings.add(new DefenseControlMapping("APP-VAL-001", "SECONDARY"));
            controlMappings.add(new DefenseControlMapping("HTTP-SEC-002", "COMPENSATING"));

            valSteps.add("Inject HTML script tags (<script>alert(1)</script>) into input fields.");
            valSteps.add("Verify rendered HTML source escapes special characters into HTML entities (&lt;script&gt;).");
            valSteps.add("Verify CSP response headers prevent execution of inline untrusted scripts.");

        } else if (fullText.contains("hsts") || fullText.contains("transport security") || fullText.contains("https")) {
            rootCause = "INSECURE_CONFIGURATION";
            rootCauseExplanation = "The web server fails to emit the HTTP Strict-Transport-Security (HSTS) response header on encrypted connections.";
            recType = "SECURITY_HEADERS";
            recTitle = "Enable Strict-Transport-Security (HSTS) Header";
            recSummary = "Configure web server or gateway to emit Strict-Transport-Security header with a long max-age duration to force HTTPS communication.";
            implGuidance = "1. Update web server (Nginx/Apache) or API gateway header configuration.\n2. Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains\n3. Verify all subdomains support valid TLS certificates before setting includeSubDomains.";
            compControls = "Enforce automatic 301 Permanent Redirects from HTTP (port 80) to HTTPS (port 443).";
            implRisks = "Setting includeSubDomains will cause browser connection failures if any internal subdomain lacks HTTPS support.";

            controlMappings.add(new DefenseControlMapping("HTTP-SEC-001", "PRIMARY"));

            valSteps.add("Send HTTPS request to web application endpoint.");
            valSteps.add("Inspect HTTP response headers for Strict-Transport-Security.");
            valSteps.add("Verify max-age directive is set to at least 31536000 seconds (1 year).");

        } else if (fullText.contains("cookie") || fullText.contains("httponly") || fullText.contains("samesite") || fullText.contains("secure flag")) {
            rootCause = "WEAK_COOKIE_CONFIGURATION";
            rootCauseExplanation = "Session or authentication cookies are missing essential security attributes (Secure, HttpOnly, SameSite).";
            recType = "COOKIE_SECURITY";
            recTitle = "Harden Session Cookie Attributes (Secure, HttpOnly, SameSite)";
            recSummary = "Configure application session management to enforce Secure=true, HttpOnly=true, and SameSite=Lax/Strict on all cookies.";
            implGuidance = "1. Update session cookie configuration in application framework/servlet container.\n2. Ensure Secure flag is set for HTTPS-only transmission.\n3. Ensure HttpOnly flag blocks JavaScript access.\n4. Set SameSite=Lax or SameSite=Strict to mitigate Cross-Site Request Forgery.";
            compControls = "Shorten session timeout duration and enforce anti-CSRF token verification.";
            implRisks = "Setting SameSite=Strict may break cross-site authentication redirects if uncoordinated.";

            controlMappings.add(new DefenseControlMapping("COOKIE-SEC-001", "PRIMARY"));

            valSteps.add("Authenticate against application login endpoint.");
            valSteps.add("Inspect Set-Cookie headers in HTTP response.");
            valSteps.add("Verify presence of Secure, HttpOnly, and SameSite flags.");

        } else if (fullText.contains("cors") || fullText.contains("cross-origin")) {
            rootCause = "INSECURE_CORS";
            rootCauseExplanation = "CORS policy permits arbitrary or untrusted origins to access sensitive API responses with credentials.";
            recType = "CONFIGURATION_CHANGE";
            recTitle = "Restrict Cross-Origin Resource Sharing (CORS) Access";
            recSummary = "Replace wildcard (*) CORS origins with an explicit allow-list of authorized domains and restrict allowed methods/headers.";
            implGuidance = "1. Remove Access-Control-Allow-Origin: * from credentialed API endpoints.\n2. Maintain an explicit whitelist of trusted web domains.\n3. Reject preflight OPTIONS requests originating from unlisted origins.";
            compControls = "Require mutual API key or Bearer token authorization headers on all API requests.";
            implRisks = "Removing allowed origins may break legitimate partner web integrations if origins are omitted from the whitelist.";

            controlMappings.add(new DefenseControlMapping("CORS-001", "PRIMARY"));

            valSteps.add("Send HTTP OPTIONS request with arbitrary Origin header (e.g. Origin: https://evil.example.com).");
            valSteps.add("Verify server rejects or omits Access-Control-Allow-Origin header in response.");
            valSteps.add("Send HTTP request with authorized Origin header and confirm successful response.");

        } else if (fullText.contains("rate") || fullText.contains("brute") || fullText.contains("throttling")) {
            rootCause = "INSUFFICIENT_RATE_LIMITING";
            rootCauseExplanation = "Endpoints lack request rate controls, permitting rapid brute-force authentication or resource consumption attacks.";
            recType = "RATE_LIMITING";
            recTitle = "Implement API Rate Limiting & Request Throttling";
            recSummary = "Deploy IP and account-based rate limiting on sensitive endpoints (login, password reset, query search).";
            implGuidance = "1. Implement rate limiting filters (e.g. Bucket4j algorithm or API Gateway rate limit rules).\n2. Enforce max request thresholds per minute per IP address.\n3. Return HTTP 429 Too Many Requests when limits are exceeded.";
            compControls = "Enforce CAPTCHA challenges after multiple consecutive failed authentication attempts.";
            implRisks = "Setting rate limits too low can affect corporate NAT users sharing a single public IP address.";

            controlMappings.add(new DefenseControlMapping("RATE-001", "PRIMARY"));

            valSteps.add("Send automated burst requests exceeding rate limit threshold to target endpoint.");
            valSteps.add("Verify server responds with HTTP 429 status code and Retry-After header.");
            valSteps.add("Verify normal request rate functions without disruption after wait period.");

        } else {
            rootCause = "INSECURE_CONFIGURATION";
            rootCauseExplanation = "Vulnerability detected in web application configuration or component implementation.";
            recType = "HARDENING";
            recTitle = "Harden Web Application Security Controls for " + finding.getTitle();
            recSummary = "Apply defensive security practices, server-side input validation, and security headers based on vulnerability details.";
            implGuidance = "1. Review vulnerability details and endpoint configuration.\n2. Implement defensive input sanitization and secure configuration baseline.\n3. Conduct code review and regression testing.";
            compControls = "Increase logging and monitoring sensitivity on affected application endpoint.";
            implRisks = "Verify custom configuration changes in staging environment prior to production deployment.";

            controlMappings.add(new DefenseControlMapping("APP-VAL-001", "PRIMARY"));
            controlMappings.add(new DefenseControlMapping("HTTP-SEC-002", "SECONDARY"));

            valSteps.add("Re-run security assessment targeted at endpoint.");
            valSteps.add("Verify vulnerability condition is no longer reproducible.");
        }

        // Priority calculation based on severity
        String priority = calculatePriority(finding.getSeverity() != null ? finding.getSeverity().name() : "MEDIUM");
        String priorityReasons = "Derived from finding severity (" + (finding.getSeverity() != null ? finding.getSeverity().name() : "MEDIUM") + ") and confirmed security impact.";

        DefenseRecommendation rec = DefenseRecommendation.builder()
                .findingId(finding.getId())
                .title(recTitle)
                .summary(recSummary)
                .rootCause(rootCause)
                .rootCauseExplanation(rootCauseExplanation)
                .recommendationType(recType)
                .priority(priority)
                .priorityReasons(priorityReasons)
                .confidence(0.92)
                .confidenceBasis("Rule-based security engine deterministic control mapping and finding evidence analysis.")
                .status("PROPOSED")
                .implementationGuidance(implGuidance)
                .compensatingControls(compControls)
                .implementationRisks(implRisks)
                .createdBy("aeigs-defense-engine")
                .build();

        DefenseEvidence evidence = DefenseEvidence.builder()
                .evidenceType("FINDING")
                .sourceType("SecurityFinding")
                .sourceId(finding.getId() != null ? finding.getId().toString() : "N/A")
                .description("Linked directly to confirmed security finding: " + finding.getTitle() + " [Severity: " + finding.getSeverity() + "]")
                .confidence(1.0)
                .build();

        DefenseValidationPlan valPlan = DefenseValidationPlan.builder()
                .planTitle("Validation Plan for " + recTitle)
                .validationStepsJson(toJsonList(valSteps))
                .verificationBoundary("Authorized AEGIS Security Retest against target endpoint.")
                .build();

        return new AnalysisResult(rec, controlMappings, List.of(evidence), valPlan);
    }

    private String calculatePriority(String severity) {
        return switch (severity.toUpperCase()) {
            case "CRITICAL" -> "CRITICAL";
            case "HIGH" -> "HIGH";
            case "LOW" -> "LOW";
            case "INFORMATIONAL" -> "INFORMATIONAL";
            default -> "MEDIUM";
        };
    }

    private String toJsonList(List<String> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            sb.append("\"").append(list.get(i).replace("\"", "\\\"")).append("\"");
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
