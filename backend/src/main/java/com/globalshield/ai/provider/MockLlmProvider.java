package com.globalshield.ai.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MockLlmProvider implements LlmProvider {

    private static final Logger log = LoggerFactory.getLogger(MockLlmProvider.class);

    private final String model;

    public MockLlmProvider() {
        this("mock-aegis-analyst-v1");
    }

    public MockLlmProvider(String model) {
        this.model = model;
    }

    @Override
    public LlmResponse generate(LlmRequest request) {
        log.info("MockLlmProvider generating deterministic security analysis result");

        String prompt = (request.getUserPrompt() == null ? "" : request.getUserPrompt()).toLowerCase();

        String verdict = "LIKELY_VULNERABILITY_EXPLOITATION";
        String summary = "The evidence indicates potential vulnerability exploitation targeting the application endpoints.";
        String sourceIpReport = "Source IP unavailable from available telemetry.";
        String timestampReport = "Exact event time unavailable from available evidence.";

        if (prompt.contains("source ip") || prompt.contains("attacker ip")) {
            if (prompt.contains("203.0.113.10")) {
                sourceIpReport = "Source IP 203.0.113.10 was observed in telemetry headers.";
            } else {
                sourceIpReport = "Source IP unavailable from available telemetry.";
            }
        }

        if (prompt.contains("sql injection") || prompt.contains("cwe-89")) {
            verdict = "VULNERABILITY_CONFIRMED";
            summary = "Confirmed SQL injection vulnerability identified on input parameter 'username'. Automated scanners and HTTP request logs confirm unsanitized input passed directly to database query context.";
        } else if (prompt.contains("xss") || prompt.contains("cwe-79")) {
            verdict = "VULNERABILITY_CONFIRMED";
            summary = "Cross-Site Scripting (XSS) vulnerability detected. Unsanitized input rendered in browser context.";
        } else if (prompt.contains("insufficient evidence")) {
            verdict = "INSUFFICIENT_EVIDENCE";
            summary = "Available telemetry does not establish whether the observed request resulted in successful exploitation.";
        }

        String jsonOutput = String.format("""
            {
              "verdict": "%s",
              "confidence": 0.86,
              "confidence_basis": "Supported by vulnerability scanner findings, HTTP telemetry, and matching CWE/OWASP knowledge.",
              "summary": "%s",
              "what_happened": "The target endpoint received potentially malformed input designed to test security controls.",
              "timeline": [
                "Scan activity initiated",
                "HTTP request recorded with test payload",
                "Scanner recorded vulnerability response"
              ],
              "affected_target": "Target application environment",
              "affected_endpoints": [
                "/api/login",
                "/login"
              ],
              "observed_facts": [
                "Security finding reported on target endpoint",
                "HTTP event captured request payload",
                "%s"
              ],
              "inferences": [
                "Input parameter validation was absent or bypassable",
                "The vulnerability enables unauthorized payload reflection or execution"
              ],
              "hypotheses": [
                "The endpoint handler may be missing parameterized input validation"
              ],
              "root_cause": "Absence of parameterized queries and strict input sanitization on web application endpoints.",
              "impact": "Potential compromise of database confidentiality and authentication integrity.",
              "supporting_evidence": [
                "F-101",
                "F-102",
                "H-331"
              ],
              "contradicting_evidence": [],
              "missing_evidence": [
                "Application server debug logs",
                "Backend database query execution logs"
              ],
              "knowledge_references": [
                "CWE-89",
                "OWASP-A03:2021-Injection"
              ],
              "recommended_next_steps": [
                "Implement parameterized queries / prepared statements",
                "Apply strict input validation and escaping",
                "Perform regression testing on modified endpoints"
              ],
              "limitations": [
                "Analysis limited to available web application scan output and HTTP telemetry."
              ]
            }
            """, verdict, summary, sourceIpReport);

        return LlmResponse.success(jsonOutput, jsonOutput, getProviderName(), model, 250);
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String getModel() {
        return model;
    }

    @Override
    public String getProviderName() {
        return "Mock-LLM-Provider";
    }

    @Override
    public LlmProviderType getProviderType() {
        return LlmProviderType.MOCK;
    }
}
