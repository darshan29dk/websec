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
public class PlasoAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(PlasoAdapter.class);

    @Value("${security.tools.plaso.path:${PLASO_PATH:log2timeline.py}}")
    private String plasoPath;

    private final ProcessRunner processRunner;

    @Override
    public String getToolName() {
        return "Plaso";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.FORENSIC_ANALYSIS;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(plasoPath, "-h"),
                    Duration.ofSeconds(5)
            );
            return result.getExitCode() == 0 || result.getStdout().contains("log2timeline");
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
                    .errorMessage("Plaso (log2timeline) super-timeline engine not available on host system at path: " + plasoPath)
                    .startedAt(startTime)
                    .completedAt(Instant.now())
                    .durationMs(0)
                    .build();
        }

        List<String> command = List.of(plasoPath, "-h");
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
