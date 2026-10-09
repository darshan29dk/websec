package com.globalshield.security.tool;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssetType;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.security.policy.ScopeValidator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TheHarvesterAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(TheHarvesterAdapter.class);

    @Value("${security.tools.theharvester.path:${THEHARVESTER_PATH:theHarvester}}")
    private String theHarvesterPath;

    private final ProcessRunner processRunner;
    private final ScopeValidator scopeValidator;

    @Override
    public String getToolName() {
        return "theHarvester";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.DNS_DISCOVERY;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(theHarvesterPath, "-h"),
                    Duration.ofSeconds(5)
            );
            return result.getExitCode() == 0 || result.getStdout().contains("theHarvester");
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public ToolExecutionResult execute(ToolExecutionRequest request) {
        Instant startTime = Instant.now();
        String primaryUrl = request.getTarget().getPrimaryUrl();

        try {
            scopeValidator.validateScope(request.getTarget());

            URI uri = new URI(primaryUrl);
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new IllegalArgumentException("Invalid target host for theHarvester");
            }

            if (!isAvailable()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(-1)
                        .errorMessage("theHarvester executable not available on host system at path: " + theHarvesterPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            // Fixed allowlisted arguments (Passive OSINT only)
            List<String> command = List.of(theHarvesterPath, "-d", host, "-b", "all", "-l", "50");
            ProcessRunner.ProcessRunnerResult runnerResult = processRunner.runProcess(command, request.getTimeout());
            Instant endTime = Instant.now();

            ToolExecutionStatus status = runnerResult.isTimedOut() ? ToolExecutionStatus.TIMEOUT :
                    runnerResult.getExitCode() == 0 ? ToolExecutionStatus.COMPLETED : ToolExecutionStatus.FAILED;

            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(status)
                    .exitCode(runnerResult.getExitCode())
                    .stdout(runnerResult.getStdout())
                    .stderr(runnerResult.getStderr())
                    .errorMessage(runnerResult.getExitCode() != 0 ? "theHarvester exited with code " + runnerResult.getExitCode() : null)
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(Duration.between(startTime, endTime).toMillis())
                    .build();

        } catch (Exception e) {
            log.error("Error executing theHarvester adapter", e);
            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.FAILED)
                    .exitCode(-1)
                    .errorMessage("Execution failed: " + e.getMessage())
                    .startedAt(startTime)
                    .completedAt(Instant.now())
                    .durationMs(Duration.between(startTime, Instant.now()).toMillis())
                    .build();
        }
    }

    @Override
    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, ToolExecutionResult result) {
        List<AssessmentAsset> assets = new ArrayList<>();
        if (result.getStdout() == null || result.getStdout().isBlank()) {
            return assets;
        }

        String[] lines = result.getStdout().split("\\r?\\n");
        boolean inHostsSection = false;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.contains("[*] Hosts found:")) {
                inHostsSection = true;
                continue;
            }
            if (trimmed.startsWith("[*]") && !trimmed.contains("Hosts found")) {
                inHostsSection = false;
            }

            if (inHostsSection && !trimmed.isEmpty() && trimmed.contains(".")) {
                String host = trimmed.split(":")[0].trim();
                assets.add(AssessmentAsset.builder()
                        .assessment(assessment)
                        .assetType(AssetType.HOST)
                        .value(host)
                        .source("theHarvester")
                        .confidence("MEDIUM")
                        .build());
            }
        }
        return assets;
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
