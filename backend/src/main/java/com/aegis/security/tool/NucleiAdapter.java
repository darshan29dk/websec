package com.aegis.security.tool;

import com.aegis.assessment.AssessmentStage;
import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.execution.ToolExecutionStatus;
import com.aegis.assessment.result.AssessmentAsset;
import com.aegis.assessment.result.AssessmentEndpoint;
import com.aegis.assessment.result.AssessmentObservation;
import com.aegis.security.policy.TargetNetworkPolicy;
import com.aegis.security.tool.parser.NucleiParser;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NucleiAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(NucleiAdapter.class);

    @Value("${security.tools.nuclei.path:${NUCLEI_PATH:nuclei}}")
    private String nucleiPath;

    private final ProcessRunner processRunner;
    private final TargetNetworkPolicy networkPolicy;
    private final NucleiParser parser;

    @Override
    public String getToolName() {
        return "Nuclei";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.VULNERABILITY_ASSESSMENT;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(nucleiPath, "-version"),
                    Duration.ofSeconds(5)
            );
            return result.getExitCode() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public ToolExecutionResult execute(ToolExecutionRequest request) {
        Instant startTime = Instant.now();
        String primaryUrl = request.getTarget().getPrimaryUrl();

        try {
            networkPolicy.validateTargetNetworkAccess(request.getTarget());

            if (!isAvailable()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(-1)
                        .errorMessage("Nuclei executable not available at path: " + nucleiPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            List<String> command = new ArrayList<>();
            command.add(nucleiPath);
            command.add("-u");
            command.add(primaryUrl);
            command.add("-jsonl");
            command.add("-severity");
            command.add("info,low,medium,high,critical");
            command.add("-no-meta");
            command.add("-disable-update-check");

            ProcessRunner.ProcessRunnerResult runnerResult = processRunner.runProcess(command, request.getTimeout());
            Instant endTime = Instant.now();

            ToolExecutionStatus status;
            if (runnerResult.isTimedOut()) {
                status = ToolExecutionStatus.TIMEOUT;
            } else if (runnerResult.getExitCode() == 0) {
                status = ToolExecutionStatus.COMPLETED;
            } else {
                status = ToolExecutionStatus.FAILED;
            }

            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(status)
                    .exitCode(runnerResult.getExitCode())
                    .stdout(runnerResult.getStdout())
                    .stderr(runnerResult.getStderr())
                    .errorMessage(runnerResult.isTimedOut() ? "Nuclei execution timed out" : null)
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(Duration.between(startTime, endTime).toMillis())
                    .build();

        } catch (Exception e) {
            log.error("Nuclei execution failed for target: {}", primaryUrl, e);
            Instant endTime = Instant.now();
            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.FAILED)
                    .exitCode(-1)
                    .errorMessage(e.getMessage())
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(Duration.between(startTime, endTime).toMillis())
                    .build();
        }
    }

    @Override
    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, ToolExecutionResult result) {
        return parser.parseAssets(assessment, result.getStdout());
    }

    @Override
    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, ToolExecutionResult result) {
        return parser.parseEndpoints(assessment, result.getStdout());
    }

    @Override
    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, ToolExecutionResult result) {
        return parser.parseObservations(assessment, result.getStdout());
    }
}
