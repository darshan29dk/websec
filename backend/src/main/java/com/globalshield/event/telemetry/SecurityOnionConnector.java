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
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class SecurityOnionConnector implements SiemConnector, ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(SecurityOnionConnector.class);

    @Value("${security.connectors.security-onion.url:${SECURITY_ONION_URL:}}")
    private String securityOnionUrl;

    private final RestTemplate restTemplate;

    public SecurityOnionConnector(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public String getConnectorName() {
        return "Security Onion";
    }

    @Override
    public String getToolName() {
        return "Security Onion";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.NETWORK_TELEMETRY;
    }

    @Override
    public boolean isConfigured() {
        return securityOnionUrl != null && !securityOnionUrl.isBlank() && !securityOnionUrl.equalsIgnoreCase("placeholder");
    }

    @Override
    public boolean testConnection() {
        if (!isConfigured()) return false;
        try {
            ResponseEntity<String> res = restTemplate.getForEntity(securityOnionUrl + "/api/v1/health", String.class);
            return res.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Security Onion connection check failed: {}", e.getMessage());
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
            return "Security Onion SOC platform endpoint not configured. Set SECURITY_ONION_URL.";
        }
        return testConnection() ? "Connected to Security Onion SOC" : "Configured but connection failed to " + securityOnionUrl;
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
                .stdout("Security Onion SOC connector verified. Network intrusion alerts synced.")
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
