package com.globalshield.security.tool;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.security.policy.ScopeValidator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SnortAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(SnortAdapter.class);

    @Value("${security.tools.snort.path:${SNORT_PATH:snort}}")
    private String snortPath;

    private final ProcessRunner processRunner;
    private final ScopeValidator scopeValidator;

    @Override
    public String getToolName() {
        return "Snort";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.NETWORK_TELEMETRY;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(snortPath, "-V"),
                    Duration.ofSeconds(5)
            );
            return result.getExitCode() == 0 || result.getStdout().contains("Snort");
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public ToolExecutionResult execute(ToolExecutionRequest request) {
        Instant startTime = Instant.now();

        try {
            scopeValidator.validateScope(request.getTarget());

            if (!isAvailable()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(-1)
                        .errorMessage("Snort IDS engine not available on host system at path: " + snortPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            // Fixed allowlisted arguments (Controlled IDS engine status check)
            List<String> command = List.of(snortPath, "-V");
            ProcessRunner.ProcessRunnerResult runnerResult = processRunner.runProcess(command, request.getTimeout());
            Instant endTime = Instant.now();

            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(runnerResult.getExitCode() == 0 ? ToolExecutionStatus.COMPLETED : ToolExecutionStatus.FAILED)
                    .exitCode(runnerResult.getExitCode())
                    .stdout(runnerResult.getStdout())
                    .stderr(runnerResult.getStderr())
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(Duration.between(startTime, endTime).toMillis())
                    .build();

        } catch (Exception e) {
            log.error("Error executing Snort adapter", e);
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
