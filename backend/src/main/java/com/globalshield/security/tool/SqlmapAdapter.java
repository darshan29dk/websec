package com.globalshield.security.tool;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.ProfileType;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.assessment.result.ObservationConfidence;
import com.globalshield.assessment.result.ObservationSeverity;
import com.globalshield.audit.AuditEventType;
import com.globalshield.audit.AuditService;
import com.globalshield.exception.BadRequestException;
import com.globalshield.security.policy.AuthorizationValidator;
import com.globalshield.security.policy.ScopeValidator;
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
public class SqlmapAdapter implements ToolAdapter {

    private static final Logger log = LoggerFactory.getLogger(SqlmapAdapter.class);

    @Value("${security.tools.sqlmap.path:${SQLMAP_PATH:sqlmap}}")
    private String sqlmapPath;

    private final ProcessRunner processRunner;
    private final ScopeValidator scopeValidator;
    private final AuthorizationValidator authorizationValidator;
    private final AuditService auditService;

    @Override
    public String getToolName() {
        return "SQLmap";
    }

    @Override
    public AssessmentStage getStage() {
        return AssessmentStage.VULNERABILITY_ASSESSMENT;
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessRunner.ProcessRunnerResult result = processRunner.runProcess(
                    List.of(sqlmapPath, "--version"),
                    Duration.ofSeconds(5)
            );
            return result.getExitCode() == 0 || result.getStdout().contains("sqlmap");
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public ToolExecutionResult execute(ToolExecutionRequest request) {
        Instant startTime = Instant.now();
        String primaryUrl = request.getTarget().getPrimaryUrl();

        try {
            // Strict Pre-Flight Policy Gating for High-Risk SQLmap
            authorizationValidator.validateAuthorization(request.getTarget());
            scopeValidator.validateScope(request.getTarget());

            // Audit log high-risk invocation request
            auditService.logEvent(
                    null, "SYSTEM",
                    AuditEventType.TOOL_EXECUTION_STARTED,
                    "HIGH_RISK_TOOL", "SQLmap",
                    "VALIDATE_GATING", "Validating pre-flight gating for SQLmap execution against " + primaryUrl,
                    null, null
            );

            if (!isAvailable()) {
                return ToolExecutionResult.builder()
                        .toolName(getToolName())
                        .stage(getStage())
                        .status(ToolExecutionStatus.NOT_AVAILABLE)
                        .exitCode(-1)
                        .errorMessage("SQLmap executable not available on host system at path: " + sqlmapPath)
                        .startedAt(startTime)
                        .completedAt(Instant.now())
                        .durationMs(0)
                        .build();
            }

            // Fixed server-side allowlisted arguments (Safe non-destructive audit profile)
            // NEVER accept arbitrary command line strings from client
            List<String> command = List.of(
                    sqlmapPath,
                    "-u", primaryUrl,
                    "--batch",
                    "--level=1",
                    "--risk=1",
                    "--timeout=15",
                    "--retries=1",
                    "--technique=BEUSTQ",
                    "--random-agent",
                    "--flush-session"
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
                    .errorMessage(runnerResult.getExitCode() != 0 ? "SQLmap exited with code " + runnerResult.getExitCode() : null)
                    .startedAt(startTime)
                    .completedAt(endTime)
                    .durationMs(Duration.between(startTime, endTime).toMillis())
                    .build();

        } catch (Exception e) {
            log.error("Error during controlled SQLmap execution", e);
            return ToolExecutionResult.builder()
                    .toolName(getToolName())
                    .stage(getStage())
                    .status(ToolExecutionStatus.FAILED)
                    .exitCode(-1)
                    .errorMessage("SQLmap gated execution failed policy validation: " + e.getMessage())
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
        List<AssessmentObservation> observations = new ArrayList<>();
        if (result.getStdout() == null || result.getStdout().isBlank()) {
            return observations;
        }

        String stdout = result.getStdout();
        if (stdout.contains("sqlmap identified the following injection point") ||
            stdout.contains("is vulnerable") || 
            stdout.contains("Parameter: ")) {
            observations.add(AssessmentObservation.builder()
                    .assessment(assessment)
                    .category("VULNERABILITY_ASSESSMENT")
                    .title("SQL Injection Vulnerability Detected (SQLmap)")
                    .description("Controlled authorized SQLmap assessment verified injection points on the target parameter.")
                    .severity(ObservationSeverity.CRITICAL)
                    .confidence(ObservationConfidence.HIGH)
                    .source("SQLmap")
                    .evidence(truncate(stdout, 2000))
                    .build());
        }

        return observations;
    }

    private String truncate(String text, int max) {
        return (text != null && text.length() > max) ? text.substring(0, max) + "\n...[truncated]" : text;
    }
}
