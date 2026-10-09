package com.globalshield.security.tool;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.assessment.result.ObservationConfidence;
import com.globalshield.assessment.result.ObservationSeverity;
import com.globalshield.security.policy.ScopeValidator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ShodanAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(ShodanAdapter.class);

    private final ShodanService shodanService;
    private final ScopeValidator scopeValidator;

    @Override
    public String getToolName() {
        return "Shodan";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.TECHNOLOGY_DISCOVERY;
    }

    @Override
    public boolean isAvailable() {
        return shodanService.isConfigured() && shodanService.checkApiAvailability();
    }

    @Override
    public ToolExecutionResult execute(ToolExecutionRequest request) {
        Instant startTime = Instant.now();
        String primaryUrl = request.getTarget().getPrimaryUrl();

        try {
            scopeValidator.validateScope(request.getTarget());

            if (!shodanService.isConfigured()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(0)
                        .errorMessage("Shodan external intelligence API key not configured (SHODAN_API_KEY)")
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            URI uri = new URI(primaryUrl);
            String host = uri.getHost();
            InetAddress address = InetAddress.getByName(host);
            String targetIp = address.getHostAddress();

            Map<String, Object> hostData = shodanService.lookupHost(targetIp);
            Instant endTime = Instant.now();

            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.COMPLETED)
                    .exitCode(0)
                    .stdout("Shodan External Intelligence Query:\nTarget: " + targetIp + "\nResult: " + hostData.toString())
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(Duration.between(startTime, endTime).toMillis())
                    .build();

        } catch (Exception e) {
            log.warn("Shodan external lookup could not be completed: {}", e.getMessage());
            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.PARTIALLY_COMPLETED)
                    .exitCode(0)
                    .stdout("Shodan query skipped or no external indexing found for target: " + e.getMessage())
                    .startedAt(startTime)
                    .completedAt(Instant.now())
                    .durationMs(Duration.between(startTime, Instant.now()).toMillis())
                    .build();
        }
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
        List<AssessmentObservation> observations = new ArrayList<>();
        if (result.getStdout() != null && result.getStdout().contains("Shodan External Intelligence Query")) {
            observations.add(AssessmentObservation.builder()
                    .assessment(assessment)
                    .category("EXTERNAL_INTELLIGENCE")
                    .title("Shodan External Attack Surface Intelligence")
                    .description("Target queried against Shodan Internet device intelligence registry. External observations correlated.")
                    .severity(ObservationSeverity.INFO)
                    .confidence(ObservationConfidence.HIGH)
                    .source("Shodan External Intelligence")
                    .evidence(result.getStdout())
                    .build());
        }
        return observations;
    }
}
