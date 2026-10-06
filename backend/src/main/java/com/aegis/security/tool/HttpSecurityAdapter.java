package com.aegis.security.tool;

import com.aegis.assessment.AssessmentStage;
import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.execution.ToolExecutionStatus;
import com.aegis.assessment.result.AssessmentAsset;
import com.aegis.assessment.result.AssessmentEndpoint;
import com.aegis.assessment.result.AssessmentObservation;
import com.aegis.security.policy.TargetNetworkPolicy;
import com.aegis.security.tool.parser.HttpSecurityParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Component
@RequiredArgsConstructor
public class HttpSecurityAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(HttpSecurityAdapter.class);

    private final TargetNetworkPolicy networkPolicy;
    private final HttpSecurityParser parser;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getToolName() {
        return "HttpSecurityAnalyzer";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.HTTP_SECURITY_ANALYSIS;
    }

    @Override
    public boolean isAvailable() {
        return true; // Native Java HTTP Client is always available
    }

    @Override
    public ToolExecutionResult execute(ToolExecutionRequest request) {
        Instant startTime = Instant.now();
        String targetUrl = request.getTarget().getPrimaryUrl();

        try {
            // Validate SSRF & Scope Network Policy
            networkPolicy.validateTargetNetworkAccess(request.getTarget());

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(new URI(targetUrl))
                    .header("User-Agent", "AEGIS Security Assessment Platform/1.0 (Authorized Audit)")
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            Instant endTime = Instant.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();

            Map<String, Object> jsonResult = new HashMap<>();
            jsonResult.put("url", targetUrl);
            jsonResult.put("statusCode", response.statusCode());

            Optional<String> contentType = response.headers().firstValue("content-type");
            jsonResult.put("contentType", contentType.orElse("unknown"));

            Optional<String> server = response.headers().firstValue("server");
            jsonResult.put("serverHeader", server.orElse(""));

            List<String> technologies = new ArrayList<>();
            server.ifPresent(s -> technologies.add("Server: " + s));
            response.headers().firstValue("x-powered-by").ifPresent(p -> technologies.add("PoweredBy: " + p));
            jsonResult.put("technologies", technologies);

            List<Map<String, String>> observations = new ArrayList<>();

            // Check HSTS
            if (!response.headers().firstValue("strict-transport-security").isPresent()) {
                observations.add(Map.of(
                        "category", "HTTP_HEADER_ANALYSIS",
                        "title", "Missing Strict-Transport-Security (HSTS) Header",
                        "description", "The web application does not enforce HTTP Strict Transport Security (HSTS).",
                        "severity", "LOW",
                        "confidence", "HIGH",
                        "evidence", "Strict-Transport-Security header not present in response"
                ));
            }

            // Check CSP
            if (!response.headers().firstValue("content-security-policy").isPresent()) {
                observations.add(Map.of(
                        "category", "HTTP_HEADER_ANALYSIS",
                        "title", "Missing Content-Security-Policy (CSP) Header",
                        "description", "Content Security Policy (CSP) header is not configured to mitigate XSS attacks.",
                        "severity", "LOW",
                        "confidence", "HIGH",
                        "evidence", "Content-Security-Policy header missing"
                ));
            }

            // Check X-Frame-Options
            if (!response.headers().firstValue("x-frame-options").isPresent()) {
                observations.add(Map.of(
                        "category", "HTTP_HEADER_ANALYSIS",
                        "title", "Missing X-Frame-Options Header",
                        "description", "X-Frame-Options header is absent, which may allow clickjacking framing.",
                        "severity", "LOW",
                        "confidence", "HIGH",
                        "evidence", "X-Frame-Options header missing"
                ));
            }

            // Check X-Content-Type-Options
            if (!response.headers().firstValue("x-content-type-options").isPresent()) {
                observations.add(Map.of(
                        "category", "HTTP_HEADER_ANALYSIS",
                        "title", "Missing X-Content-Type-Options Header",
                        "description", "X-Content-Type-Options header is absent, permitting MIME-sniffing.",
                        "severity", "INFO",
                        "confidence", "HIGH",
                        "evidence", "X-Content-Type-Options header missing"
                ));
            }

            jsonResult.put("observations", observations);

            String stdoutStr = objectMapper.writeValueAsString(jsonResult);

            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.COMPLETED)
                    .exitCode(0)
                    .stdout(stdoutStr)
                    .stderr("")
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(durationMs)
                    .build();

        } catch (Exception e) {
            log.error("HttpSecurityAdapter failed for target {}: {}", targetUrl, e.getMessage());
            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.FAILED)
                    .exitCode(-1)
                    .errorMessage(e.getMessage())
                    .startedAt(startTime)
                    .completedAt(Instant.now())
                    .durationMs(Duration.between(startTime, Instant.now()).toMillis())
                    .build();
        }
    }

    @Override
    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, ToolExecutionResult result) {
        return parser.parseAssets(assessment, result.getStdout());
    }

    @Override
    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, ToolExecutionResult result) {
        return parser.parseEndpoints(assessment, result.getStdout());
    }

    @Override
    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, ToolExecutionResult result) {
        return parser.parseObservations(assessment, result.getStdout());
    }
}
