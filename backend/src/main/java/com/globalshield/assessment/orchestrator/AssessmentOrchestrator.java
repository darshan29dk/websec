package com.globalshield.assessment.orchestrator;

import com.globalshield.assessment.AssessmentProfile;
import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.assessment.execution.ToolExecution;
import com.globalshield.assessment.execution.ToolExecutionRepository;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import com.globalshield.assessment.result.*;
import com.globalshield.audit.AuditEventType;
import com.globalshield.audit.AuditService;
import com.globalshield.security.policy.AuthorizationValidator;
import com.globalshield.security.policy.ScopeValidator;
import com.globalshield.security.policy.TargetNetworkPolicy;
import com.globalshield.security.policy.ToolPolicyValidator;
import com.globalshield.security.tool.*;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.TargetStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AssessmentOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(AssessmentOrchestrator.class);

    private final SecurityAssessmentRepository assessmentRepository;
    private final ToolExecutionRepository toolExecutionRepository;
    private final AssessmentAssetRepository assetRepository;
    private final AssessmentEndpointRepository endpointRepository;
    private final AssessmentObservationRepository observationRepository;
    private final TargetNetworkPolicy networkPolicy;
    private final ScopeValidator scopeValidator;
    private final AuthorizationValidator authorizationValidator;
    private final ToolPolicyValidator toolPolicyValidator;
    private final List<ToolAdapter> toolAdapters;
    private final AuditService auditService;
    private final com.globalshield.attacksurface.service.AttackSurfaceService attackSurfaceService;
    private final com.globalshield.finding.service.FindingNormalizationService findingNormalizationService;

    @Async
    public void executeAssessmentAsync(UUID assessmentId, UUID requestingUserId, String requestingUserEmail) {
        executeAssessment(assessmentId, requestingUserId, requestingUserEmail);
    }

    public void executeAssessment(UUID assessmentId, UUID requestingUserId, String requestingUserEmail) {
        log.info("Starting assessment execution orchestrator for assessment ID: {}", assessmentId);
        
        SecurityAssessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assessment not found: " + assessmentId));

        if (assessment.getStatus() == AssessmentStatus.RUNNING || 
            assessment.getStatus() == AssessmentStatus.VALIDATING ||
            assessment.getStatus() == AssessmentStatus.COMPLETED) {
            log.warn("Assessment {} is already in status {}", assessmentId, assessment.getStatus());
            return;
        }

        // Transition: QUEUED -> VALIDATING
        Instant now = Instant.now();
        assessment.setStatus(AssessmentStatus.VALIDATING);
        assessment.setQueuedAt(now);
        assessment.setValidationStartedAt(now);
        assessment.setCurrentStage(AssessmentStage.TARGET_VALIDATION);
        assessment.setProgressPercent(5);
        assessmentRepository.save(assessment);

        auditService.logEvent(
                requestingUserId, requestingUserEmail,
                AuditEventType.ASSESSMENT_START_REQUESTED,
                "SECURITY_ASSESSMENT", assessmentId.toString(),
                "START_ASSESSMENT", "Assessment validation started",
                null, null
        );

        // Stage 1: Validation
        SecurityTarget target = assessment.getTarget();
        if (target == null || target.getStatus() != TargetStatus.ACTIVE) {
            failAssessment(assessment, "Target is null or inactive", requestingUserId, requestingUserEmail);
            return;
        }

        try {
            scopeValidator.validateScope(target);
            authorizationValidator.validateAuthorization(target);
        } catch (Exception e) {
            failAssessment(assessment, "Target scope/authorization validation failed: " + e.getMessage(), requestingUserId, requestingUserEmail);
            return;
        }

        // Validation passed -> Transition to RUNNING
        assessment.setStatus(AssessmentStatus.RUNNING);
        assessment.setStartedAt(Instant.now());
        assessment.setProgressPercent(15);
        assessmentRepository.save(assessment);

        auditService.logEvent(
                requestingUserId, requestingUserEmail,
                AuditEventType.ASSESSMENT_STARTED,
                "SECURITY_ASSESSMENT", assessmentId.toString(),
                "EXECUTE_ASSESSMENT", "Assessment execution started",
                null, null
        );

        // Determine profile stages
        List<AssessmentStage> stagesToRun = getStagesForProfile(assessment.getProfile());
        boolean hasToolFailures = false;

        int totalStages = stagesToRun.size();
        for (int i = 0; i < totalStages; i++) {
            AssessmentStage stage = stagesToRun.get(i);
            
            // Check cancellation signal
            SecurityAssessment currentAssessment = assessmentRepository.findById(assessmentId).orElse(assessment);
            if (currentAssessment.getStatus() == AssessmentStatus.CANCELLED) {
                log.info("Assessment {} was cancelled by user. Halting pipeline.", assessmentId);
                auditService.logEvent(
                        requestingUserId, requestingUserEmail,
                        AuditEventType.ASSESSMENT_CANCELLED,
                        "SECURITY_ASSESSMENT", assessmentId.toString(),
                        "CANCEL_ASSESSMENT", "Assessment cancelled by user",
                        null, null
                );
                return;
            }

            // Update current stage & progress
            int progress = 15 + (int) (((double) (i + 1) / totalStages) * 75.0);
            assessment.setCurrentStage(stage);
            assessment.setProgressPercent(progress);
            assessmentRepository.save(assessment);

            if (stage == AssessmentStage.TARGET_VALIDATION ||
                stage == AssessmentStage.RESULT_NORMALIZATION ||
                stage == AssessmentStage.FINALIZATION) {
                continue;
            }

            // Execute tools for this stage
            List<ToolAdapter> adaptersForStage = toolAdapters.stream()
                    .filter(a -> a.getStage() == stage)
                    .toList();

            for (ToolAdapter adapter : adaptersForStage) {
                boolean toolSuccess = runToolAdapter(assessment, adapter, requestingUserId, requestingUserEmail);
                if (!toolSuccess) {
                    hasToolFailures = true;
                }
            }
        }

        // Phase 3 Attack Surface & Finding Normalization
        try {
            attackSurfaceService.processAssessmentResults(assessmentId);
            findingNormalizationService.processAssessmentFindings(assessmentId);
        } catch (Exception e) {
            log.error("Error during attack surface and finding normalization for assessment {}", assessmentId, e);
        }

        // Finalization Stage
        assessment.setCurrentStage(AssessmentStage.FINALIZATION);
        assessment.setProgressPercent(100);
        assessment.setCompletedAt(Instant.now());

        if (hasToolFailures) {
            assessment.setStatus(AssessmentStatus.PARTIALLY_COMPLETED);
            auditService.logEvent(
                    requestingUserId, requestingUserEmail,
                    AuditEventType.ASSESSMENT_PARTIALLY_COMPLETED,
                    "SECURITY_ASSESSMENT", assessmentId.toString(),
                    "FINALIZE_ASSESSMENT", "Assessment completed with partial tool failures or unavailable tools",
                    null, null
            );
        } else {
            assessment.setStatus(AssessmentStatus.COMPLETED);
            auditService.logEvent(
                    requestingUserId, requestingUserEmail,
                    AuditEventType.ASSESSMENT_COMPLETED,
                    "SECURITY_ASSESSMENT", assessmentId.toString(),
                    "FINALIZE_ASSESSMENT", "Assessment completed successfully",
                    null, null
            );
        }

        assessmentRepository.save(assessment);
        log.info("Assessment {} finished with status {}", assessmentId, assessment.getStatus());
    }

    private boolean runToolAdapter(SecurityAssessment assessment, ToolAdapter adapter, UUID requestingUserId, String requestingUserEmail) {
        String toolName = adapter.getToolName();
        log.info("Executing tool adapter {} for stage {}", toolName, adapter.getStage());

        SecurityTarget target = assessment.getTarget();
        // Policy validation check
        try {
            toolPolicyValidator.validateToolExecutionPolicy(toolName, assessment.getProfile(), target);
        } catch (Exception e) {
            log.warn("Tool {} blocked by policy for assessment {}: {}", toolName, assessment.getId(), e.getMessage());
            ToolExecution blockedExecution = ToolExecution.builder()
                    .assessment(assessment)
                    .toolName(toolName)
                    .stage(adapter.getStage())
                    .status(ToolExecutionStatus.BLOCKED)
                    .startedAt(Instant.now())
                    .completedAt(Instant.now())
                    .errorMessage("Policy Validation: " + e.getMessage())
                    .scopeReference(target != null ? target.getPrimaryUrl() : null)
                    .build();
            toolExecutionRepository.save(blockedExecution);
            return true;
        }

        String authRef = (target != null && target.getAuthorizations() != null && !target.getAuthorizations().isEmpty())
                ? target.getAuthorizations().get(0).getId().toString()
                : null;

        ToolExecution execution = ToolExecution.builder()
                .assessment(assessment)
                .toolName(toolName)
                .stage(adapter.getStage())
                .status(ToolExecutionStatus.RUNNING)
                .startedAt(Instant.now())
                .scopeReference(target != null ? target.getPrimaryUrl() : null)
                .authorizationReference(authRef)
                .build();
        toolExecutionRepository.save(execution);

        auditService.logEvent(
                requestingUserId, requestingUserEmail,
                AuditEventType.TOOL_EXECUTION_STARTED,
                "TOOL_EXECUTION", execution.getId().toString(),
                "EXECUTE_TOOL", "Started security tool " + toolName,
                null, null
        );

        ToolExecutionRequest request = ToolExecutionRequest.builder()
                .assessmentId(assessment.getId())
                .target(assessment.getTarget())
                .stage(adapter.getStage())
                .timeout(Duration.ofMinutes(5))
                .build();

        ToolExecutionResult result = adapter.execute(request);

        execution.setStatus(result.getStatus());
        execution.setCompletedAt(result.getCompletedAt());
        execution.setDurationMs(result.getDurationMs());
        execution.setExitCode(result.getExitCode());
        execution.setStdoutOutput(result.getStdout() != null ? truncate(result.getStdout(), 50000) : null);
        execution.setStderrOutput(result.getStderr() != null ? truncate(result.getStderr(), 50000) : null);
        execution.setErrorMessage(result.getErrorMessage());
        toolExecutionRepository.save(execution);

        if (result.getStatus() == ToolExecutionStatus.COMPLETED) {
            auditService.logEvent(
                    requestingUserId, requestingUserEmail,
                    AuditEventType.TOOL_EXECUTION_COMPLETED,
                    "TOOL_EXECUTION", execution.getId().toString(),
                    "COMPLETE_TOOL", "Tool " + toolName + " completed successfully",
                    null, null
            );

            // Save normalized assets, endpoints, observations
            List<AssessmentAsset> assets = adapter.parseAssets(assessment, result);
            if (assets != null && !assets.isEmpty()) {
                assetRepository.saveAll(assets);
            }

            List<AssessmentEndpoint> endpoints = adapter.parseEndpoints(assessment, result);
            if (endpoints != null && !endpoints.isEmpty()) {
                endpointRepository.saveAll(endpoints);
            }

            List<AssessmentObservation> observations = adapter.parseObservations(assessment, result);
            if (observations != null && !observations.isEmpty()) {
                observationRepository.saveAll(observations);
            }

            return true;
        } else {
            auditService.logEvent(
                    requestingUserId, requestingUserEmail,
                    AuditEventType.TOOL_EXECUTION_FAILED,
                    "TOOL_EXECUTION", execution.getId().toString(),
                    "FAIL_TOOL", "Tool " + toolName + " failed or status: " + result.getStatus(),
                    null, null
            );
            return false;
        }
    }

    private void failAssessment(SecurityAssessment assessment, String reason, UUID requestingUserId, String requestingUserEmail) {
        log.error("Assessment {} validation/execution failed: {}", assessment.getId(), reason);
        assessment.setStatus(AssessmentStatus.FAILED);
        assessment.setProgressPercent(0);
        assessment.setCompletedAt(Instant.now());
        assessmentRepository.save(assessment);

        auditService.logEvent(
                requestingUserId, requestingUserEmail,
                AuditEventType.ASSESSMENT_FAILED,
                "SECURITY_ASSESSMENT", assessment.getId().toString(),
                "FAIL_ASSESSMENT", reason,
                null, null
        );
    }

    private List<AssessmentStage> getStagesForProfile(AssessmentProfile profile) {
        String profileName = profile != null && profile.getProfileType() != null ? profile.getProfileType().name() : "";
        if ("PASSIVE".equalsIgnoreCase(profileName)) {
            return List.of(
                    AssessmentStage.TARGET_VALIDATION,
                    AssessmentStage.DNS_DISCOVERY,
                    AssessmentStage.HTTP_SECURITY_ANALYSIS,
                    AssessmentStage.TECHNOLOGY_DISCOVERY,
                    AssessmentStage.RESULT_NORMALIZATION,
                    AssessmentStage.FINALIZATION
            );
        } else if ("COMPREHENSIVE_AUTHORIZED".equalsIgnoreCase(profileName)) {
            return List.of(
                    AssessmentStage.TARGET_VALIDATION,
                    AssessmentStage.DNS_DISCOVERY,
                    AssessmentStage.PORT_DISCOVERY,
                    AssessmentStage.TECHNOLOGY_DISCOVERY,
                    AssessmentStage.HTTP_SECURITY_ANALYSIS,
                    AssessmentStage.WEB_SERVER_ASSESSMENT,
                    AssessmentStage.VULNERABILITY_ASSESSMENT,
                    AssessmentStage.NETWORK_TELEMETRY,
                    AssessmentStage.RESULT_NORMALIZATION,
                    AssessmentStage.FINALIZATION
            );
        } else {
            // STANDARD_AUTHORIZED
            return List.of(
                    AssessmentStage.TARGET_VALIDATION,
                    AssessmentStage.DNS_DISCOVERY,
                    AssessmentStage.PORT_DISCOVERY,
                    AssessmentStage.TECHNOLOGY_DISCOVERY,
                    AssessmentStage.HTTP_SECURITY_ANALYSIS,
                    AssessmentStage.WEB_SERVER_ASSESSMENT,
                    AssessmentStage.VULNERABILITY_ASSESSMENT,
                    AssessmentStage.RESULT_NORMALIZATION,
                    AssessmentStage.FINALIZATION
            );
        }
    }

    private String truncate(String text, int maxLen) {
        if (text == null || text.length() <= maxLen) return text;
        return text.substring(0, maxLen) + "\n... [Truncated for storage limit]";
    }
}
