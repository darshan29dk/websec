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
public class TcpdumpAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(TcpdumpAdapter.class);

    @Value("${security.tools.tcpdump.path:${TCPDUMP_PATH:tcpdump}}")
    private String tcpdumpPath;

    private final ProcessRunner processRunner;
    private final ScopeValidator scopeValidator;

    @Override
    public String getToolName() {
        return "tcpdump";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.NETWORK_TELEMETRY;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(tcpdumpPath, "--version"),
                    Duration.ofSeconds(5)
            );
            return result.getExitCode() == 0 || result.getStdout().contains("tcpdump");
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
                        .errorMessage("tcpdump executable not available on host system at path: " + tcpdumpPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            // Fixed allowlisted arguments (Controlled packet capture verification)
            List<String> command = List.of(tcpdumpPath, "--version");
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
            log.error("Error executing tcpdump adapter", e);
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
