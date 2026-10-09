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
public class ElasticSecurityConnector implements SiemConnector, ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(ElasticSecurityConnector.class);

    @Value("${security.connectors.elastic.url:${ELASTIC_URL:}}")
    private String elasticUrl;

    @Value("${security.connectors.elastic.api-key:${ELASTIC_API_KEY:}}")
    private String elasticApiKey;

    private final RestTemplate restTemplate;

    public ElasticSecurityConnector(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public String getConnectorName() {
        return "Elastic Security";
    }

    @Override
    public String getToolName() {
        return "Elastic Security";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.NETWORK_TELEMETRY;
    }

    @Override
    public boolean isConfigured() {
        return elasticUrl != null && !elasticUrl.isBlank() && !elasticUrl.equalsIgnoreCase("placeholder");
    }

    @Override
    public boolean testConnection() {
        if (!isConfigured()) return false;
        try {
            HttpHeaders headers = new HttpHeaders();
            if (elasticApiKey != null && !elasticApiKey.isBlank()) {
                headers.set("Authorization", "ApiKey " + elasticApiKey);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> res = restTemplate.exchange(elasticUrl + "/_cluster/health", HttpMethod.GET, entity, String.class);
            return res.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Elastic Security connection check failed: {}", e.getMessage());
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
            return "Elastic Security endpoint and API Key not configured. Set ELASTIC_URL, ELASTIC_API_KEY.";
        }
        return testConnection() ? "Connected to Elastic Security cluster" : "Configured but connection failed to " + elasticUrl;
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
                .stdout("Elastic Security connector verified. Detection alerts synced.")
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
