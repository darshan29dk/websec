package com.aegis.security.tool;

import com.aegis.assessment.AssessmentStage;
import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.execution.ToolExecutionStatus;
import com.aegis.assessment.result.AssessmentAsset;
import com.aegis.assessment.result.AssessmentEndpoint;
import com.aegis.assessment.result.AssessmentObservation;
import com.aegis.security.policy.TargetNetworkPolicy;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FfufAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(FfufAdapter.class);

    @Value("${security.tools.ffuf.path:${FFUF_PATH:ffuf}}")
    private String ffufPath;

    private final ProcessRunner processRunner;
    private final TargetNetworkPolicy networkPolicy;

    @Override
    public String getToolName() {
        return "ffuf";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.WEB_SERVER_ASSESSMENT;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(ffufPath, "-V"),
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

            URI uri = new URI(primaryUrl);
            String baseUrl = uri.getScheme() + "://" + uri.getHost() + (uri.getPort() > 0 ? ":" + uri.getPort() : "");

            // Allowlisted rate-limited ffuf execution
            List<String> command = List.of(
                    ffufPath,
                    "-u", baseUrl + "/FUZZ",
                    "-w", "/usr/share/wordlists/dirb/common.txt",
                    "-rate", "20",
                    "-mc", "200,204,301,302,307,401,403",
                    "-t", "5"
            );

            if (!isAvailable()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(-1)
                        .errorMessage("ffuf executable not available on host system at path: " + ffufPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            ProcessRunner.ProcessRunnerResult runnerResult = processRunner.runProcess(command, request.getTimeout());
            Instant endTime = Instant.now();

            ToolExecutionStatus status = runnerResult.isTimedOut() ? ToolExecutionStatus.TIMEOUT :
                    (runnerResult.getExitCode() == 0 ? ToolExecutionStatus.COMPLETED : ToolExecutionStatus.FAILED);

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
            log.error("ffuf execution failed for target {}: {}", primaryUrl, e.getMessage());
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
        return Collections.emptyList();
    }

    @Override
    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, ToolExecutionResult result) {
        return Collections.emptyList();
    }

    @Override
    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, ToolExecutionResult result) {
        return Collections.emptyList();
    }
}
