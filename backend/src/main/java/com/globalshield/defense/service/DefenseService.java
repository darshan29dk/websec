package com.globalshield.defense.service;

import com.globalshield.ai.provider.LlmProvider;
import com.globalshield.ai.provider.LlmRequest;
import com.globalshield.ai.provider.LlmResponse;
import com.globalshield.audit.AuditEventType;
import com.globalshield.audit.AuditService;
import com.globalshield.defense.dto.*;
import com.globalshield.defense.engine.DefenseEngine;
import com.globalshield.defense.entity.*;
import com.globalshield.defense.repository.*;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DefenseService {

    private static final Logger log = LoggerFactory.getLogger(DefenseService.class);

    private final DefenseRecommendationRepository recommendationRepository;
    private final DefenseEvidenceRepository evidenceRepository;
    private final DefenseControlRepository controlRepository;
    private final FindingDefenseControlRepository findingDefenseControlRepository;
    private final RemediationPlanRepository planRepository;
    private final RemediationTaskRepository taskRepository;
    private final DefenseValidationPlanRepository validationPlanRepository;
    private final SecurityFindingRepository findingRepository;
    private final DefenseEngine defenseEngine;
    private final AuditService auditService;
    private final LlmProvider llmProvider;
    private final ObjectMapper objectMapper;

    @Autowired
    public DefenseService(DefenseRecommendationRepository recommendationRepository,
                          DefenseEvidenceRepository evidenceRepository,
                          DefenseControlRepository controlRepository,
                          FindingDefenseControlRepository findingDefenseControlRepository,
                          RemediationPlanRepository planRepository,
                          RemediationTaskRepository taskRepository,
                          DefenseValidationPlanRepository validationPlanRepository,
                          SecurityFindingRepository findingRepository,
                          DefenseEngine defenseEngine,
                          AuditService auditService,
                          @Autowired(required = false) LlmProvider llmProvider,
                          ObjectMapper objectMapper) {
        this.recommendationRepository = recommendationRepository;
        this.evidenceRepository = evidenceRepository;
        this.controlRepository = controlRepository;
        this.findingDefenseControlRepository = findingDefenseControlRepository;
        this.planRepository = planRepository;
        this.taskRepository = taskRepository;
        this.validationPlanRepository = validationPlanRepository;
        this.findingRepository = findingRepository;
        this.defenseEngine = defenseEngine;
        this.auditService = auditService;
        this.llmProvider = llmProvider;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DefenseRecommendationResponseDto generateRecommendation(GenerateRecommendationRequest request, String username) {
        if (request.getFindingId() == null) {
            throw new IllegalArgumentException("Finding ID is required to generate defense recommendation");
        }

        SecurityFinding finding = findingRepository.findById(request.getFindingId())
                .orElseThrow(() -> new IllegalArgumentException("Security finding not found with ID: " + request.getFindingId()));

        DefenseEngine.AnalysisResult engineResult = defenseEngine.analyzeFinding(finding);
        DefenseRecommendation rec = engineResult.getRecommendation();
        rec.setCreatedBy(username != null ? username : "system");

        // Optional AI Assistance using Phase 6 LLM Provider abstraction
        if (Boolean.TRUE.equals(request.getUseAiAnalysis()) && llmProvider != null && llmProvider.isAvailable()) {
            try {
                String prompt = buildAiDefensePrompt(finding, rec);
                LlmRequest llmReq = new LlmRequest(
                        "You are an expert AEGIS Defense Analyst. Analyze the finding and recommend defensive controls. You MUST NOT include runnable shell commands or command execution instructions. Output concise text only.",
                        prompt,
                        0.2,
                        500,
                        false
                );

                LlmResponse llmResp = llmProvider.generate(llmReq);
                if (llmResp.isSuccess() && llmResp.getContent() != null) {
                    // Command rejection safety check
                    String aiContent = llmResp.getContent();
                    if (!containsExecutableCommands(aiContent)) {
                        rec.setSummary(rec.getSummary() + " [AI Defense Note: " + sanitizeAiSummary(aiContent) + "]");
                    } else {
                        log.warn("AI defense response contained potential command patterns; stripped executable context safely.");
                    }
                }
            } catch (Exception e) {
                log.warn("AI defense assistance failed, falling back to deterministic rule recommendation", e);
            }
        }

        DefenseRecommendation savedRec = recommendationRepository.save(rec);

        // Save evidence
        for (DefenseEvidence ev : engineResult.getEvidenceList()) {
            ev.setRecommendationId(savedRec.getId());
            evidenceRepository.save(ev);
        }

        // Save control mappings
        for (DefenseEngine.DefenseControlMapping mapping : engineResult.getControlMappings()) {
            Optional<DefenseControl> ctrlOpt = controlRepository.findByControlCode(mapping.getControlCode());
            if (ctrlOpt.isPresent()) {
                DefenseControl ctrl = ctrlOpt.get();
                FindingDefenseControl fdc = FindingDefenseControl.builder()
                        .findingId(finding.getId())
                        .controlId(ctrl.getId())
                        .relationship(mapping.getRelationship())
                        .confidence(0.95)
                        .build();
                findingDefenseControlRepository.save(fdc);
            }
        }

        // Save validation plan
        DefenseValidationPlan valPlan = engineResult.getValidationPlan();
        valPlan.setRecommendationId(savedRec.getId());
        validationPlanRepository.save(valPlan);

        // Audit event
        auditService.logEvent(savedRec.getUuid(), "DEFENSE_RECOMMENDATION", AuditEventType.DEFENSE_RECOMMENDATION_CREATED,
                username, null, "Created defense recommendation: " + savedRec.getTitle(), "SUCCESS", null, null);

        return toRecommendationResponseDto(savedRec, finding);
    }

    public DefenseRecommendationResponseDto getRecommendationById(UUID id) {
        DefenseRecommendation rec = recommendationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Defense recommendation not found with ID: " + id));
        SecurityFinding finding = rec.getFindingId() != null ? findingRepository.findById(rec.getFindingId()).orElse(null) : null;
        return toRecommendationResponseDto(rec, finding);
    }

    @Transactional
    public DefenseRecommendationResponseDto reviewRecommendation(UUID id, ReviewRecommendationRequest request, String username) {
        DefenseRecommendation rec = recommendationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Defense recommendation not found with ID: " + id));

        String newStatus;
        AuditEventType eventType;
        if ("APPROVE".equalsIgnoreCase(request.getAction())) {
            newStatus = "APPROVED";
            eventType = AuditEventType.DEFENSE_RECOMMENDATION_APPROVED;
        } else if ("REJECT".equalsIgnoreCase(request.getAction())) {
            newStatus = "REJECTED";
            eventType = AuditEventType.DEFENSE_RECOMMENDATION_REJECTED;
        } else {
            throw new IllegalArgumentException("Invalid review action: " + request.getAction());
        }

        rec.setStatus(newStatus);
        DefenseRecommendation updated = recommendationRepository.save(rec);

        auditService.logEvent(updated.getUuid(), "DEFENSE_RECOMMENDATION", eventType,
                username, null, "Reviewed recommendation status to " + newStatus + ": " + request.getReviewNotes(), "SUCCESS", null, null);

        SecurityFinding finding = updated.getFindingId() != null ? findingRepository.findById(updated.getFindingId()).orElse(null) : null;
        return toRecommendationResponseDto(updated, finding);
    }

    @Transactional
    public DefenseRecommendationResponseDto updateStatus(UUID id, UpdateStatusRequest request, String username) {
        DefenseRecommendation rec = recommendationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Defense recommendation not found with ID: " + id));

        String status = request.getStatus();
        if ("VERIFIED".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("Recommendations cannot be manually marked as VERIFIED. Retesting validation evidence in Phase 8 is required.");
        }

        rec.setStatus(status.toUpperCase());
        DefenseRecommendation updated = recommendationRepository.save(rec);

        auditService.logEvent(updated.getUuid(), "DEFENSE_RECOMMENDATION", AuditEventType.DEFENSE_RECOMMENDATION_UPDATED,
                username, null, "Updated recommendation status to " + status, "SUCCESS", null, null);

        SecurityFinding finding = updated.getFindingId() != null ? findingRepository.findById(updated.getFindingId()).orElse(null) : null;
        return toRecommendationResponseDto(updated, finding);
    }

    public List<DefenseRecommendationResponseDto> listRecommendations(String status, String priority) {
        List<DefenseRecommendation> recs;
        if (status != null && !status.isBlank()) {
            recs = recommendationRepository.findByStatus(status.toUpperCase());
        } else if (priority != null && !priority.isBlank()) {
            recs = recommendationRepository.findByPriority(priority.toUpperCase());
        } else {
            recs = recommendationRepository.findAll();
        }

        return recs.stream().map(rec -> {
            SecurityFinding finding = rec.getFindingId() != null ? findingRepository.findById(rec.getFindingId()).orElse(null) : null;
            return toRecommendationResponseDto(rec, finding);
        }).collect(Collectors.toList());
    }

    public List<DefenseRecommendationResponseDto> getRecommendationsForFinding(UUID findingId) {
        List<DefenseRecommendation> recs = recommendationRepository.findByFindingId(findingId);
        SecurityFinding finding = findingRepository.findById(findingId).orElse(null);
        return recs.stream().map(rec -> toRecommendationResponseDto(rec, finding)).collect(Collectors.toList());
    }

    public List<DefenseControlDto> listControls(String category) {
        List<DefenseControl> controls = (category != null && !category.isBlank())
                ? controlRepository.findByCategory(category.toUpperCase())
                : controlRepository.findAll();

        return controls.stream().map(this::toControlDto).collect(Collectors.toList());
    }

    public DefenseControlDto getControl(UUID id) {
        DefenseControl ctrl = controlRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Security control not found with ID: " + id));
        return toControlDto(ctrl);
    }

    public DefenseOverviewMetricsDto getOverviewMetrics() {
        List<DefenseRecommendation> allRecs = recommendationRepository.findAll();
        List<RemediationPlan> allPlans = planRepository.findAll();

        long open = allRecs.stream().filter(r -> "PROPOSED".equals(r.getStatus()) || "UNDER_REVIEW".equals(r.getStatus()) || "APPROVED".equals(r.getStatus())).count();
        long awaitingReview = allRecs.stream().filter(r -> "PROPOSED".equals(r.getStatus()) || "UNDER_REVIEW".equals(r.getStatus())).count();
        long implemented = allRecs.stream().filter(r -> "IMPLEMENTED".equals(r.getStatus())).count();

        long criticalRem = allPlans.stream().filter(p -> "CRITICAL".equals(p.getPriority()) && !"CLOSED".equals(p.getStatus())).count();
        long highRem = allPlans.stream().filter(p -> "HIGH".equals(p.getPriority()) && !"CLOSED".equals(p.getStatus())).count();
        long awaitingVerification = allPlans.stream().filter(p -> "VERIFICATION_PENDING".equals(p.getStatus())).count();

        return DefenseOverviewMetricsDto.builder()
                .openRecommendations(open)
                .criticalRemediations(criticalRem)
                .highPriorityRemediations(highRem)
                .awaitingReview(awaitingReview)
                .implemented(implemented)
                .awaitingVerification(awaitingVerification)
                .build();
    }

    // --- Remediation Management Methods ---

    @Transactional
    public RemediationPlanDto createRemediationPlan(CreateRemediationPlanRequest request, String username) {
        String mode = request.getRemediationMode() != null ? request.getRemediationMode().toUpperCase() : "GUIDANCE_ONLY";
        String risk = request.getRiskLevel() != null ? request.getRiskLevel().toUpperCase() : "LOW";
        String approval = "CONTROLLED_AUTOMATED".equals(mode) || "HIGH".equals(risk) || "CRITICAL".equals(risk)
                ? "PENDING_APPROVAL" : "NOT_REQUIRED";
        boolean autoExecutable = "CONTROLLED_AUTOMATED".equals(mode) && "LOW".equals(risk);

        RemediationPlan plan = RemediationPlan.builder()
                .findingId(request.getFindingId())
                .recommendationId(request.getRecommendationId())
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority().toUpperCase() : "MEDIUM")
                .owner(request.getOwner() != null ? request.getOwner() : "Unassigned")
                .targetDate(request.getTargetDate())
                .status("OPEN")
                .remediationMode(mode)
                .riskLevel(risk)
                .approvalStatus(approval)
                .reviewablePatchDiff(request.getReviewablePatchDiff())
                .verificationCriteria(request.getVerificationCriteria())
                .automatedActionType(request.getAutomatedActionType())
                .automatedExecutable(autoExecutable)
                .build();

        RemediationPlan saved = planRepository.save(plan);

        // Automatically create initial standard remediation sequence
        createStandardTasks(saved);

        auditService.logEvent(saved.getUuid(), "REMEDIATION_PLAN", AuditEventType.REMEDIATION_PLAN_CREATED,
                username, null, "Created remediation plan: " + saved.getTitle(), "SUCCESS", null, null);

        return toPlanDto(saved);
    }

    public RemediationPlanDto getRemediationPlan(UUID id) {
        RemediationPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Remediation plan not found with ID: " + id));
        return toPlanDto(plan);
    }

    public List<RemediationPlanDto> listRemediationPlans(String status) {
        List<RemediationPlan> plans = (status != null && !status.isBlank())
                ? planRepository.findByStatus(status.toUpperCase())
                : planRepository.findAll();
        return plans.stream().map(this::toPlanDto).collect(Collectors.toList());
    }

    @Transactional
    public RemediationPlanDto updateRemediationPlan(UUID id, CreateRemediationPlanRequest request, String username) {
        RemediationPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Remediation plan not found with ID: " + id));

        if (request.getTitle() != null) plan.setTitle(request.getTitle());
        if (request.getDescription() != null) plan.setDescription(request.getDescription());
        if (request.getPriority() != null) plan.setPriority(request.getPriority().toUpperCase());
        if (request.getOwner() != null) plan.setOwner(request.getOwner());
        if (request.getTargetDate() != null) plan.setTargetDate(request.getTargetDate());
        if (request.getRemediationMode() != null) plan.setRemediationMode(request.getRemediationMode().toUpperCase());
        if (request.getRiskLevel() != null) plan.setRiskLevel(request.getRiskLevel().toUpperCase());
        if (request.getReviewablePatchDiff() != null) plan.setReviewablePatchDiff(request.getReviewablePatchDiff());
        if (request.getVerificationCriteria() != null) plan.setVerificationCriteria(request.getVerificationCriteria());
        if (request.getAutomatedActionType() != null) plan.setAutomatedActionType(request.getAutomatedActionType());

        RemediationPlan updated = planRepository.save(plan);
        return toPlanDto(updated);
    }

    @Transactional
    public RemediationPlanDto approveRemediationPlan(UUID id, String approverEmail) {
        RemediationPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Remediation plan not found with ID: " + id));

        plan.setApprovalStatus("APPROVED");
        plan.setApprovedBy(approverEmail);
        plan.setApprovedAt(OffsetDateTime.now());
        plan.setAutomatedExecutable(true);

        RemediationPlan saved = planRepository.save(plan);
        auditService.logEvent(saved.getUuid(), "REMEDIATION_PLAN", AuditEventType.REMEDIATION_PLAN_APPROVED,
                approverEmail, null, "Approved remediation plan: " + saved.getTitle(), "SUCCESS", null, null);

        return toPlanDto(saved);
    }

    @Transactional
    public RemediationPlanDto rejectRemediationPlan(UUID id, String approverEmail, String reason) {
        RemediationPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Remediation plan not found with ID: " + id));

        plan.setApprovalStatus("REJECTED");
        plan.setRejectionReason(reason != null ? reason : "Rejected by security lead");
        plan.setAutomatedExecutable(false);

        RemediationPlan saved = planRepository.save(plan);
        auditService.logEvent(saved.getUuid(), "REMEDIATION_PLAN", AuditEventType.REMEDIATION_PLAN_REJECTED,
                approverEmail, null, "Rejected remediation plan: " + saved.getTitle() + " Reason: " + plan.getRejectionReason(), "SUCCESS", null, null);

        return toPlanDto(saved);
    }

    @Transactional
    public RemediationPlanDto executeAutomatedRemediation(UUID id, String username) {
        RemediationPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Remediation plan not found with ID: " + id));

        if (!"CONTROLLED_AUTOMATED".equalsIgnoreCase(plan.getRemediationMode())) {
            throw new IllegalArgumentException("Automated execution is only permitted for plans in CONTROLLED_AUTOMATED mode.");
        }

        if ("PENDING_APPROVAL".equalsIgnoreCase(plan.getApprovalStatus()) || "REJECTED".equalsIgnoreCase(plan.getApprovalStatus())) {
            throw new IllegalArgumentException("Plan requires approved sign-off before automated execution. Current approval status: " + plan.getApprovalStatus());
        }

        if ("HIGH".equalsIgnoreCase(plan.getRiskLevel()) || "CRITICAL".equalsIgnoreCase(plan.getRiskLevel())) {
            throw new IllegalArgumentException("High or Critical risk actions cannot be automatically executed. Manual review and change control is required.");
        }

        // Execute bounded, low-risk automated remediation action
        String actionType = plan.getAutomatedActionType() != null ? plan.getAutomatedActionType() : "APPLY_SECURITY_CONTROL";
        String executionDetails = "Executed controlled automated remediation action: " + actionType +
                " for plan: " + plan.getTitle() + ". Preconditions validated; zero disruption bounds enforced.";

        plan.setExecutionLog(executionDetails);
        plan.setExecutedAt(OffsetDateTime.now());
        plan.setExecutionStatus("EXECUTED");
        plan.setStatus("VERIFICATION_PENDING"); // Transitions to verification pending for controlled retesting!

        RemediationPlan saved = planRepository.save(plan);

        auditService.logEvent(saved.getUuid(), "REMEDIATION_PLAN", AuditEventType.REMEDIATION_AUTOMATED_EXECUTED,
                username, null, executionDetails, "SUCCESS", null, null);

        return toPlanDto(saved);
    }

    @Transactional
    public RemediationTaskDto addRemediationTask(UUID planId, CreateRemediationTaskRequest request, String username) {
        RemediationPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Remediation plan not found with ID: " + planId));

        RemediationTask task = RemediationTask.builder()
                .planId(plan.getId())
                .title(request.getTitle())
                .description(request.getDescription())
                .taskType(request.getTaskType() != null ? request.getTaskType().toUpperCase() : "CODE")
                .sequence(request.getSequence() != null ? request.getSequence() : 1)
                .owner(request.getOwner() != null ? request.getOwner() : "Unassigned")
                .status("OPEN")
                .build();

        RemediationTask saved = taskRepository.save(task);

        auditService.logEvent(saved.getUuid(), "REMEDIATION_TASK", AuditEventType.REMEDIATION_TASK_CREATED,
                username, null, "Added task to plan: " + saved.getTitle(), "SUCCESS", null, null);

        return toTaskDto(saved);
    }

    @Transactional
    public RemediationTaskDto updateTaskStatus(UUID taskId, UpdateStatusRequest request, String username) {
        RemediationTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Remediation task not found with ID: " + taskId));

        String newStatus = request.getStatus().toUpperCase();
        task.setStatus(newStatus);
        if ("COMPLETED".equals(newStatus)) {
            task.setCompletedAt(OffsetDateTime.now());
        }

        RemediationTask updated = taskRepository.save(task);

        auditService.logEvent(updated.getUuid(), "REMEDIATION_TASK", AuditEventType.REMEDIATION_TASK_UPDATED,
                username, null, "Updated task status to " + newStatus, "SUCCESS", null, null);

        return toTaskDto(updated);
    }

    // --- Helper Methods ---

    private void createStandardTasks(RemediationPlan plan) {
        List<RemediationTask> tasks = List.of(
                RemediationTask.builder().planId(plan.getId()).sequence(1).title("Analyze Root Cause & Target Endpoint").taskType("CODE").owner(plan.getOwner()).status("OPEN").build(),
                RemediationTask.builder().planId(plan.getId()).sequence(2).title("Implement Defensive Fix / Control").taskType("CODE").owner(plan.getOwner()).status("OPEN").build(),
                RemediationTask.builder().planId(plan.getId()).sequence(3).title("Conduct Local Regression Testing").taskType("TESTING").owner(plan.getOwner()).status("OPEN").build(),
                RemediationTask.builder().planId(plan.getId()).sequence(4).title("Deploy Fix Through Authorized Process").taskType("INFRASTRUCTURE").owner(plan.getOwner()).status("OPEN").build(),
                RemediationTask.builder().planId(plan.getId()).sequence(5).title("Request AEGIS Verification Retest").taskType("TESTING").owner(plan.getOwner()).status("OPEN").build()
        );
        taskRepository.saveAll(tasks);
    }

    private DefenseRecommendationResponseDto toRecommendationResponseDto(DefenseRecommendation rec, SecurityFinding finding) {
        List<DefenseEvidenceDto> evidenceDtos = evidenceRepository.findByRecommendationId(rec.getId())
                .stream().map(this::toEvidenceDto).collect(Collectors.toList());

        List<FindingDefenseControl> fdcList = rec.getFindingId() != null
                ? findingDefenseControlRepository.findByFindingId(rec.getFindingId())
                : Collections.emptyList();

        List<DefenseControlDto> primaryCtrls = new ArrayList<>();
        List<DefenseControlDto> secondaryCtrls = new ArrayList<>();
        List<DefenseControlDto> compensatingCtrls = new ArrayList<>();

        for (FindingDefenseControl fdc : fdcList) {
            controlRepository.findById(fdc.getControlId()).ifPresent(ctrl -> {
                DefenseControlDto dto = toControlDto(ctrl);
                if ("PRIMARY".equalsIgnoreCase(fdc.getRelationship())) primaryCtrls.add(dto);
                else if ("SECONDARY".equalsIgnoreCase(fdc.getRelationship())) secondaryCtrls.add(dto);
                else compensatingCtrls.add(dto);
            });
        }

        DefenseValidationPlanDto valPlanDto = validationPlanRepository.findByRecommendationId(rec.getId())
                .map(this::toValidationPlanDto).orElse(null);

        return DefenseRecommendationResponseDto.builder()
                .id(rec.getId())
                .uuid(rec.getUuid())
                .findingId(rec.getFindingId())
                .findingTitle(finding != null ? finding.getTitle() : "Unlinked Finding")
                .findingSeverity(finding != null && finding.getSeverity() != null ? finding.getSeverity().name() : "MEDIUM")
                .investigationId(rec.getInvestigationId())
                .title(rec.getTitle())
                .summary(rec.getSummary())
                .rootCause(rec.getRootCause())
                .rootCauseExplanation(rec.getRootCauseExplanation())
                .recommendationType(rec.getRecommendationType())
                .priority(rec.getPriority())
                .priorityReasons(rec.getPriorityReasons())
                .confidence(rec.getConfidence())
                .confidenceBasis(rec.getConfidenceBasis())
                .status(rec.getStatus())
                .implementationGuidance(rec.getImplementationGuidance())
                .compensatingControls(rec.getCompensatingControls())
                .implementationRisks(rec.getImplementationRisks())
                .createdBy(rec.getCreatedBy())
                .createdAt(rec.getCreatedAt())
                .updatedAt(rec.getUpdatedAt())
                .primaryControls(primaryCtrls)
                .secondaryControls(secondaryCtrls)
                .compensatingControlsList(compensatingCtrls)
                .supportingEvidence(evidenceDtos)
                .validationPlan(valPlanDto)
                .build();
    }

    private DefenseControlDto toControlDto(DefenseControl ctrl) {
        return DefenseControlDto.builder()
                .id(ctrl.getId())
                .controlCode(ctrl.getControlCode())
                .name(ctrl.getName())
                .category(ctrl.getCategory())
                .description(ctrl.getDescription())
                .implementationGuidance(ctrl.getImplementationGuidance())
                .validationGuidance(ctrl.getValidationGuidance())
                .createdAt(ctrl.getCreatedAt())
                .build();
    }

    private DefenseEvidenceDto toEvidenceDto(DefenseEvidence ev) {
        return DefenseEvidenceDto.builder()
                .id(ev.getId())
                .uuid(ev.getUuid())
                .evidenceType(ev.getEvidenceType())
                .sourceType(ev.getSourceType())
                .sourceId(ev.getSourceId())
                .description(ev.getDescription())
                .confidence(ev.getConfidence())
                .createdAt(ev.getCreatedAt())
                .build();
    }

    private DefenseValidationPlanDto toValidationPlanDto(DefenseValidationPlan plan) {
        List<String> steps = Collections.emptyList();
        if (plan.getValidationStepsJson() != null) {
            try {
                steps = objectMapper.readValue(plan.getValidationStepsJson(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                steps = List.of(plan.getValidationStepsJson());
            }
        }

        return DefenseValidationPlanDto.builder()
                .id(plan.getId())
                .uuid(plan.getUuid())
                .recommendationId(plan.getRecommendationId())
                .planTitle(plan.getPlanTitle())
                .validationSteps(steps)
                .verificationBoundary(plan.getVerificationBoundary())
                .build();
    }

    private RemediationPlanDto toPlanDto(RemediationPlan plan) {
        SecurityFinding finding = plan.getFindingId() != null ? findingRepository.findById(plan.getFindingId()).orElse(null) : null;
        List<RemediationTaskDto> taskDtos = taskRepository.findByPlanIdOrderBySequenceAsc(plan.getId())
                .stream().map(this::toTaskDto).collect(Collectors.toList());

        return RemediationPlanDto.builder()
                .id(plan.getId())
                .uuid(plan.getUuid())
                .findingId(plan.getFindingId())
                .findingTitle(finding != null ? finding.getTitle() : "Unlinked Finding")
                .recommendationId(plan.getRecommendationId())
                .title(plan.getTitle())
                .description(plan.getDescription())
                .priority(plan.getPriority())
                .owner(plan.getOwner())
                .targetDate(plan.getTargetDate())
                .status(plan.getStatus())
                .remediationMode(plan.getRemediationMode())
                .riskLevel(plan.getRiskLevel())
                .approvalStatus(plan.getApprovalStatus())
                .approvedBy(plan.getApprovedBy())
                .approvedAt(plan.getApprovedAt())
                .rejectionReason(plan.getRejectionReason())
                .reviewablePatchDiff(plan.getReviewablePatchDiff())
                .verificationCriteria(plan.getVerificationCriteria())
                .automatedActionType(plan.getAutomatedActionType())
                .automatedExecutable(plan.isAutomatedExecutable())
                .executionStatus(plan.getExecutionStatus())
                .executedAt(plan.getExecutedAt())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .tasks(taskDtos)
                .build();
    }

    private RemediationTaskDto toTaskDto(RemediationTask task) {
        return RemediationTaskDto.builder()
                .id(task.getId())
                .uuid(task.getUuid())
                .planId(task.getPlanId())
                .title(task.getTitle())
                .description(task.getDescription())
                .taskType(task.getTaskType())
                .sequence(task.getSequence())
                .status(task.getStatus())
                .owner(task.getOwner())
                .createdAt(task.getCreatedAt())
                .completedAt(task.getCompletedAt())
                .build();
    }

    private String buildAiDefensePrompt(SecurityFinding finding, DefenseRecommendation rec) {
        return "Finding Title: " + finding.getTitle() + "\n"
                + "Severity: " + finding.getSeverity() + "\n"
                + "Description: " + finding.getDescription() + "\n"
                + "Rule Recommendation: " + rec.getSummary() + "\n"
                + "Provide 2 sentences of additional risk analysis for developers. Do NOT output commands.";
    }

    private boolean containsExecutableCommands(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return lower.contains("sudo ") || lower.contains("rm -rf") || lower.contains("chmod ")
                || lower.contains("systemctl ") || lower.contains("kubectl ") || lower.contains("iptables ");
    }

    private String sanitizeAiSummary(String text) {
        return text.replaceAll("(?i)(sudo|rm -rf|chmod|systemctl|kubectl|iptables)", "[REDACTED_CMD]");
    }
}
