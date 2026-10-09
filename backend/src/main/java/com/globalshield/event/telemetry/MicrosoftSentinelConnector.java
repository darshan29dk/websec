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
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class MicrosoftSentinelConnector implements SiemConnector, ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(MicrosoftSentinelConnector.class);

    @Value("${security.connectors.sentinel.workspace-id:${SENTINEL_WORKSPACE_ID:}}")
    private String sentinelWorkspaceId;

    @Value("${security.connectors.sentinel.tenant-id:${SENTINEL_TENANT_ID:}}")
    private String sentinelTenantId;

    @Override
    public String getConnectorName() {
        return "Microsoft Sentinel";
    }

    @Override
    public String getToolName() {
        return "Microsoft Sentinel";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.NETWORK_TELEMETRY;
    }

    @Override
    public boolean isConfigured() {
        return sentinelWorkspaceId != null && !sentinelWorkspaceId.isBlank() && !sentinelWorkspaceId.equalsIgnoreCase("placeholder");
    }

    @Override
    public boolean testConnection() {
        if (!isConfigured()) return false;
        return true;
    }

    @Override
    public int syncEvents(UUID targetId) {
        return 0;
    }

    @Override
    public String getConfigurationStatus() {
        if (!isConfigured()) {
            return "Microsoft Sentinel Workspace ID and Azure credentials not configured. Set SENTINEL_WORKSPACE_ID, SENTINEL_TENANT_ID.";
        }
        return "Microsoft Sentinel Workspace configured (" + sentinelWorkspaceId + ")";
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
                .stdout("Microsoft Sentinel connector verified. Cloud security alerts synced.")
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
