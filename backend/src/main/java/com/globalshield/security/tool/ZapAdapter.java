package com.globalshield.security.tool;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.security.policy.TargetNetworkPolicy;
import com.globalshield.security.tool.parser.ZapParser;
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
public class ZapAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(ZapAdapter.class);

    @Value("${security.tools.zap.path:${ZAP_PATH:zap-cli}}")
    private String zapPath;

    private final ProcessRunner processRunner;
    private final TargetNetworkPolicy networkPolicy;
    private final ZapParser parser;

    @Override
    public String getToolName() {
        return "ZAP";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.WEB_SERVER_ASSESSMENT;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(zapPath, "--version"),
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
                        .errorMessage("OWASP ZAP executable not available at path: " + zapPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            List<String> command = new ArrayList<>();
            command.add(zapPath);
            command.add("quick-scan");
            command.add("-s");
            command.add("passive");
            command.add("-j");
            command.add(primaryUrl);

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
                    .errorMessage(runnerResult.isTimedOut() ? "OWASP ZAP execution timed out" : null)
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(Duration.between(startTime, endTime).toMillis())
                    .build();

        } catch (Exception e) {
            log.error("OWASP ZAP execution failed for target: {}", primaryUrl, e);
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
