package com.aegis.security.tool;

import com.aegis.assessment.AssessmentStage;
import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.execution.ToolExecutionStatus;
import com.aegis.assessment.result.AssessmentAsset;
import com.aegis.assessment.result.AssessmentEndpoint;
import com.aegis.assessment.result.AssessmentObservation;
import com.aegis.security.policy.TargetNetworkPolicy;
import com.aegis.security.tool.parser.NmapParser;
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
public class NmapAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(NmapAdapter.class);

    @Value("${security.tools.nmap.path:${NMAP_PATH:nmap}}")
    private String nmapPath;

    private final ProcessRunner processRunner;
    private final TargetNetworkPolicy networkPolicy;
    private final NmapParser parser;

    @Override
    public String getToolName() {
        return "Nmap";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.PORT_DISCOVERY;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(nmapPath, "--version"),
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
            String host = uri.getHost();

            if (host == null || host.isBlank()) {
                throw new IllegalArgumentException("Invalid host for Nmap execution");
            }

            // Build allowlisted arguments (Conservative port discovery profile)
            List<String> command = new ArrayList<>();
            command.add(nmapPath);
            command.add("-sV");
            command.add("-T3");
            command.add("--top-ports");
            command.add("100");
            command.add(host);

            if (!isAvailable()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(-1)
                        .errorMessage("Nmap executable not available on host system at path: " + nmapPath)
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
            log.error("Nmap execution failed for target {}: {}", primaryUrl, e.getMessage());
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
