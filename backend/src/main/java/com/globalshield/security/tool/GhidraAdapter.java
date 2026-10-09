package com.globalshield.security.tool;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
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
public class GhidraAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(GhidraAdapter.class);

    @Value("${security.tools.ghidra.path:${GHIDRA_PATH:analyzeHeadless}}")
    private String ghidraPath;

    private final ProcessRunner processRunner;

    @Override
    public String getToolName() {
        return "Ghidra";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.FORENSIC_ANALYSIS;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(ghidraPath, "-help"),
                    Duration.ofSeconds(5)
            );
            return result.getExitCode() == 0 || result.getStdout().contains("Ghidra") || result.getStderr().contains("Ghidra");
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
                    .errorMessage("Ghidra SRE headless analyzer not available on host system at path: " + ghidraPath)
                    .startedAt(startTime)
                    .completedAt(Instant.now())
                    .durationMs(0)
                    .build();
        }

        List<String> command = List.of(ghidraPath, "-help");
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
