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

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class GobusterAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(GobusterAdapter.class);

    @Value("${security.tools.gobuster.path:${GOBUSTER_PATH:gobuster}}")
    private String gobusterPath;

    @Value("${security.tools.gobuster.wordlist:/usr/share/wordlists/dirb/common.txt}")
    private String wordlistPath;

    private final ProcessRunner processRunner;
    private final ScopeValidator scopeValidator;

    private static final Pattern GOBUSTER_LINE = Pattern.compile("^(.*?)\\s+\\(Status:\\s*(\\d+)\\)");

    @Override
    public String getToolName() {
        return "Gobuster";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.WEB_SERVER_ASSESSMENT;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(gobusterPath, "version"),
                    Duration.ofSeconds(5)
            );
            return result.getExitCode() == 0 || result.getStdout().contains("Gobuster");
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

            if (!isAvailable()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(-1)
                        .errorMessage("Gobuster executable not available on host system at path: " + gobusterPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            // Fallback wordlist if default doesn't exist
            String effectiveWordlist = wordlistPath;
            if (!new File(wordlistPath).exists()) {
                Path tempWordlist = Files.createTempFile("gobuster_safe_common", ".txt");
                Files.write(tempWordlist, List.of(
                        "admin", "login", "api", "v1", "robots.txt", "sitemap.xml",
                        "dashboard", "assets", "static", "health", "metrics", "test"
                ));
                effectiveWordlist = tempWordlist.toAbsolutePath().toString();
            }

            // Fixed allowlisted arguments (Strict scope, conservative concurrency)
            List<String> command = List.of(
                    gobusterPath, "dir",
                    "-u", primaryUrl,
                    "-w", effectiveWordlist,
                    "-q",
                    "-k",
                    "-t", "10",
                    "--timeout", "5s"
            );

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
                    .errorMessage(runnerResult.getExitCode() != 0 ? "Gobuster exited with code " + runnerResult.getExitCode() : null)
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(Duration.between(startTime, endTime).toMillis())
                    .build();

        } catch (Exception e) {
            log.error("Error executing Gobuster adapter", e);
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
        List<AssessmentEndpoint> endpoints = new ArrayList<>();
        if (result.getStdout() == null || result.getStdout().isBlank()) {
            return endpoints;
        }

        String baseUrl = assessment.getTarget().getPrimaryUrl().replaceAll("/+$", "");
        String[] lines = result.getStdout().split("\\r?\\n");

        for (String line : lines) {
            Matcher matcher = GOBUSTER_LINE.matcher(line.trim());
            if (matcher.find()) {
                String path = matcher.group(1).trim();
                int statusCode = 200;
                try {
                    statusCode = Integer.parseInt(matcher.group(2).trim());
                } catch (Exception ignored) {}

                String fullUrl = path.startsWith("http") ? path : baseUrl + (path.startsWith("/") ? path : "/" + path);

                endpoints.add(AssessmentEndpoint.builder()
                        .assessment(assessment)
                        .url(fullUrl)
                        .method("GET")
                        .statusCode(statusCode)
                        .source("Gobuster")
                        .build());
            }
        }

        return endpoints;
    }

    @Override
    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, ToolExecutionResult result) {
        return List.of();
    }
}
