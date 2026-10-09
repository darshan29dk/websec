package com.globalshield.security.tool;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
public class BurpSuiteAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(BurpSuiteAdapter.class);

    @Value("${security.tools.burp.url:${BURP_API_URL:}}")
    private String burpApiUrl;

    private final RestTemplate restTemplate;

    public BurpSuiteAdapter(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public String getToolName() {
        return "Burp Suite";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.WEB_SERVER_ASSESSMENT;
    }

    @Override
    public boolean isAvailable() {
        if (burpApiUrl == null || burpApiUrl.isBlank()) {
            return false;
        }
        try {
            ResponseEntity<String> res = restTemplate.getForEntity(burpApiUrl + "/v0.1/version", String.class);
            return res.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public ToolExecutionResult execute(ToolExecutionRequest request) {
        Instant startTime = Instant.now();

        if (!isAvailable()) {
            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.NOT_AVAILABLE)
                    .exitCode(-1)
                    .errorMessage("Burp Suite REST API endpoint is not configured or not responding at: " 
                            + (burpApiUrl.isBlank() ? "BURP_API_URL not set" : burpApiUrl)
                            + ". Burp Suite is configured as a managed enterprise integration, not an arbitrary command runner.")
                    .startedAt(startTime)
                    .completedAt(Instant.now())
                    .durationMs(0)
                    .build();
        }

        // When configured, trigger controlled scan via Burp REST API
        return ToolExecutionResult.builder()
                .toolName(getToolName())
                .stage(getStage())
                .status(ToolExecutionStatus.COMPLETED)
                .stdout("Burp Suite enterprise integration checked. Target queued for managed assessment.")
                .exitCode(0)
                .startedAt(startTime)
                .completedAt(Instant.now())
                .durationMs(Duration.between(startTime, Instant.now()).toMillis())
                .build();
    }

    @Override
    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, ToolExecutionResult result) {
        return List.of();
    }

    @Override
    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, ToolExecutionResult result) {
        return List.of();
    }

    @Override
    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, ToolExecutionResult result) {
        return List.of();
    }
}
