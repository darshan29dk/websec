package com.aegis.assessment;

import com.aegis.assessment.dto.*;
import com.aegis.assessment.execution.ToolExecution;
import com.aegis.assessment.execution.ToolExecutionRepository;
import com.aegis.assessment.orchestrator.AssessmentOrchestrator;
import com.aegis.assessment.result.*;
import com.aegis.audit.AuditService;
import com.aegis.audit.AuditEventType;
import com.aegis.common.PageResponse;
import com.aegis.exception.*;
import com.aegis.security.UserPrincipal;
import com.aegis.target.*;
import com.aegis.user.User;
import com.aegis.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssessmentService {

    private final SecurityAssessmentRepository assessmentRepository;
    private final AssessmentProfileRepository profileRepository;
    private final SecurityTargetRepository targetRepository;
    private final TargetAuthorizationRepository authorizationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final AssessmentOrchestrator orchestrator;
    private final ToolExecutionRepository toolExecutionRepository;
    private final AssessmentAssetRepository assetRepository;
    private final AssessmentEndpointRepository endpointRepository;
    private final AssessmentObservationRepository observationRepository;

    @Transactional
    public AssessmentResponse createAssessment(
            CreateAssessmentRequest request,
            UserPrincipal currentUser,
            String ipAddress,
            String userAgent) {

        // 1. Verify target exists
        SecurityTarget target = targetRepository.findById(request.getTargetId())
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", request.getTargetId()));

        // 2. Verify target is ACTIVE
        if (target.getStatus() != TargetStatus.ACTIVE) {
            throw new BadRequestException("Cannot create assessment: target is " + target.getStatus());
        }

        // 3. Verify user explicitly confirmed authorization
        if (!Boolean.TRUE.equals(request.getAuthorizationConfirmed())) {
            throw new BadRequestException("Explicit user confirmation of target authorization is mandatory");
        }

        // 4. Verify assessment profile exists and is enabled
        AssessmentProfile profile = profileRepository.findById(request.getProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("AssessmentProfile", "id", request.getProfileId()));
        if (!profile.isEnabled()) {
            throw new BadRequestException("Assessment profile '" + profile.getName() + "' is disabled");
        }

        // 5. Verify valid, unexpired authorization record exists
        List<TargetAuthorization> validAuths = authorizationRepository.findValidAuthorizationsForTarget(target.getId(), LocalDate.now());
        if (validAuths.isEmpty()) {
            List<TargetAuthorization> allAuths = authorizationRepository.findByTargetIdOrderByCreatedAtDesc(target.getId());
            if (allAuths.isEmpty()) {
                throw new AuthorizationRequiredException("No explicit authorization record exists for target '" + target.getName() + "'. Assessment unavailable until authorization is recorded.");
            } else {
                throw new ExpiredAuthorizationException("Target authorization has expired for '" + target.getName() + "'. Assessment unavailable until authorization is renewed.");
            }
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        // 6. Create assessment record in QUEUED state
        SecurityAssessment assessment = SecurityAssessment.builder()
                .target(target)
                .profile(profile)
                .status(AssessmentStatus.QUEUED)
                .requestedBy(user)
                .authorizationConfirmed(true)
                .build();

        assessment = assessmentRepository.save(assessment);

        auditService.logEvent(
                user.getId(),
                user.getEmail(),
                AuditEventType.ASSESSMENT_CREATED,
                "SecurityAssessment",
                assessment.getId().toString(),
                "ASSESSMENT_CREATED",
                "Created assessment [" + profile.getProfileType() + "] for target " + target.getName(),
                ipAddress,
                userAgent
        );

        return getAssessmentById(assessment.getId());
    }

    @Transactional
    public AssessmentResponse startAssessment(UUID id, UserPrincipal currentUser, String ipAddress, String userAgent) {
        SecurityAssessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAssessment", "id", id));

        if (assessment.getStatus() == AssessmentStatus.RUNNING || assessment.getStatus() == AssessmentStatus.VALIDATING) {
            throw new BadRequestException("Assessment is already running or validating");
        }

        if (assessment.getStatus() == AssessmentStatus.COMPLETED) {
            throw new BadRequestException("Assessment is already completed");
        }

        // Trigger orchestrator asynchronously
        orchestrator.executeAssessmentAsync(id, currentUser.getId(), currentUser.getEmail());

        return getAssessmentById(id);
    }

    @Transactional(readOnly = true)
    public PageResponse<AssessmentResponse> getAssessments(int page, int size, UUID targetId, AssessmentStatus status) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SecurityAssessment> pageResult = assessmentRepository.searchAssessments(targetId, status, pageRequest);
        Page<AssessmentResponse> dtoPage = pageResult.map(AssessmentResponse::fromEntity);
        return PageResponse.from(dtoPage);
    }

    @Transactional(readOnly = true)
    public AssessmentResponse getAssessmentById(UUID id) {
        SecurityAssessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAssessment", "id", id));
        return AssessmentResponse.fromEntity(assessment);
    }

    @Transactional(readOnly = true)
    public AssessmentStatusResponse getAssessmentStatus(UUID id) {
        SecurityAssessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAssessment", "id", id));
        return AssessmentStatusResponse.fromEntity(assessment);
    }

    @Transactional(readOnly = true)
    public PageResponse<ToolExecutionResponse> getToolExecutions(UUID id, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<ToolExecution> pageResult = toolExecutionRepository.findByAssessmentId(id, pageRequest);
        return PageResponse.from(pageResult.map(ToolExecutionResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PageResponse<AssetResponse> getAssets(UUID id, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AssessmentAsset> pageResult = assetRepository.findByAssessmentId(id, pageRequest);
        return PageResponse.from(pageResult.map(AssetResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PageResponse<EndpointResponse> getEndpoints(UUID id, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "discoveredAt"));
        Page<AssessmentEndpoint> pageResult = endpointRepository.findByAssessmentId(id, pageRequest);
        return PageResponse.from(pageResult.map(EndpointResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PageResponse<ObservationResponse> getObservations(UUID id, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AssessmentObservation> pageResult = observationRepository.findByAssessmentId(id, pageRequest);
        return PageResponse.from(pageResult.map(ObservationResponse::fromEntity));
    }

    @Transactional
    public AssessmentResponse cancelAssessment(UUID id, UserPrincipal currentUser, String ipAddress, String userAgent) {
        SecurityAssessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAssessment", "id", id));

        if (assessment.getStatus() == AssessmentStatus.COMPLETED || assessment.getStatus() == AssessmentStatus.CANCELLED) {
            throw new BadRequestException("Assessment cannot be cancelled in status " + assessment.getStatus());
        }

        assessment.setStatus(AssessmentStatus.CANCELLED);
        assessment = assessmentRepository.save(assessment);

        auditService.logEvent(
                currentUser.getId(),
                currentUser.getEmail(),
                AuditEventType.ASSESSMENT_CANCELLED,
                "SecurityAssessment",
                assessment.getId().toString(),
                "ASSESSMENT_CANCELLED",
                "Cancelled assessment for target " + assessment.getTarget().getName(),
                ipAddress,
                userAgent
        );

        return getAssessmentById(assessment.getId());
    }

    @Transactional
    public AssessmentResponse retryFailedStage(UUID id, AssessmentStage stage, UserPrincipal currentUser, String ipAddress, String userAgent) {
        SecurityAssessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAssessment", "id", id));

        if (assessment.getStatus() != AssessmentStatus.PARTIALLY_COMPLETED && assessment.getStatus() != AssessmentStatus.FAILED) {
            throw new BadRequestException("Only failed or partially completed assessments can be retried");
        }

        // Reset status to QUEUED and execute orchestrator
        assessment.setStatus(AssessmentStatus.QUEUED);
        assessmentRepository.save(assessment);

        orchestrator.executeAssessmentAsync(id, currentUser.getId(), currentUser.getEmail());

        return getAssessmentById(id);
    }
}
