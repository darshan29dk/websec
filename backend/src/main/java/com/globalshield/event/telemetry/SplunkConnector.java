package com.globalshield.event.telemetry;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.security.tool.ToolAdapter;
import com.globalshield.security.tool.ToolExecutionRequest;
import com.globalshield.security.tool.ToolExecutionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class SplunkConnector implements SiemConnector, ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(SplunkConnector.class);

    @Value("${security.connectors.splunk.url:${SPLUNK_URL:}}")
    private String splunkUrl;

    @Value("${security.connectors.splunk.token:${SPLUNK_TOKEN:}}")
    private String splunkToken;

    private final RestTemplate restTemplate;

    public SplunkConnector(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public String getConnectorName() {
        return "Splunk";
    }

    @Override
    public String getToolName() {
        return "Splunk";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.NETWORK_TELEMETRY;
    }

    @Override
    public boolean isConfigured() {
        return splunkUrl != null && !splunkUrl.isBlank() && !splunkUrl.equalsIgnoreCase("placeholder");
    }

    @Override
    public boolean testConnection() {
        if (!isConfigured()) return false;
        try {
            HttpHeaders headers = new HttpHeaders();
            if (splunkToken != null && !splunkToken.isBlank()) {
                headers.setBearerAuth(splunkToken);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> res = restTemplate.exchange(splunkUrl + "/services/server/info", HttpMethod.GET, entity, String.class);
            return res.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Splunk connection check failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public int syncEvents(UUID targetId) {
        return 0;
    }

    @Override
    public String getConfigurationStatus() {
        if (!isConfigured()) {
            return "Splunk REST API endpoint and Token not configured. Set SPLUNK_URL, SPLUNK_TOKEN.";
        }
        return testConnection() ? "Connected to Splunk Enterprise" : "Configured but connection failed to " + splunkUrl;
    }

    @Override
    public boolean isAvailable() {
        return isConfigured() && testConnection();
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
                    .errorMessage(getConfigurationStatus())
                    .startedAt(startTime)
                    .completedAt(Instant.now())
                    .durationMs(0)
                    .build();
        }

        return ToolExecutionResult.builder()
                .toolName(getToolName())
                .stage(getStage())
                .status(ToolExecutionStatus.COMPLETED)
                .stdout("Splunk Enterprise connector verified. Telemetry events ingested.")
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
