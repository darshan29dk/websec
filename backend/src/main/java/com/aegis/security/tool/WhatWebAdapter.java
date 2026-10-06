package com.aegis.security.tool;

import com.aegis.assessment.AssessmentStage;
import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.execution.ToolExecutionStatus;
import com.aegis.assessment.result.AssessmentAsset;
import com.aegis.assessment.result.AssessmentEndpoint;
import com.aegis.assessment.result.AssessmentObservation;
import com.aegis.security.policy.TargetNetworkPolicy;
import com.aegis.security.tool.parser.WhatWebParser;
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
public class WhatWebAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(WhatWebAdapter.class);

    @Value("${security.tools.whatweb.path:${WHATWEB_PATH:whatweb}}")
    private String whatWebPath;

    private final ProcessRunner processRunner;
    private final TargetNetworkPolicy networkPolicy;
    private final WhatWebParser parser;

    @Override
    public String getToolName() {
        return "WhatWeb";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.TECHNOLOGY_DISCOVERY;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(whatWebPath, "--version"),
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

            List<String> command = new ArrayList<>();
            command.add(whatWebPath);
            command.add("--aggression");
            command.add("1");
            command.add("--color=never");
            command.add("--log-json=-");
            command.add(primaryUrl);

            if (!isAvailable()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(-1)
                        .errorMessage("WhatWeb executable not available at path: " + whatWebPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

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
                    .errorMessage(runnerResult.getErrorMessage())
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(runnerResult.getDurationMs())
                    .build();

        } catch (Exception e) {
            log.error("WhatWeb execution failed for target {}: {}", primaryUrl, e.getMessage());
            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.FAILED)
                    .exitCode(-1)
                    .errorMessage(e.getMessage())
                    .startedAt(startTime)
                    .completedAt(Instant.now())
                    .durationMs(Duration.between(startTime, Instant.now()).toMillis())
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
