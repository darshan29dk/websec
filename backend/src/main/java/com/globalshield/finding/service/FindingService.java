package com.globalshield.finding.service;

import com.globalshield.audit.AuditEventType;
import com.globalshield.audit.AuditService;
import com.globalshield.common.PageResponse;
import com.globalshield.exception.BadRequestException;
import com.globalshield.exception.ResourceNotFoundException;
import com.globalshield.finding.dto.*;
import com.globalshield.finding.entity.*;
import com.globalshield.finding.repository.*;
import com.globalshield.security.UserPrincipal;
import com.globalshield.user.User;
import com.globalshield.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FindingService {

    private final SecurityFindingRepository findingRepository;
    private final FindingEvidenceRepository evidenceRepository;
    private final FindingReferenceRepository referenceRepository;
    private final FindingCorrelationRepository correlationRepository;
    private final FindingCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<SecurityFindingResponse> getFindings(
            int page,
            int size,
            UUID assessmentId,
            FindingSeverity severity,
            FindingStatus status,
            FindingConfidence confidence,
            String source,
            String search) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SecurityFinding> pageResult = findingRepository.searchFindings(
                assessmentId, severity, status, confidence, source, search, pageRequest
        );
        return PageResponse.from(pageResult.map(SecurityFindingResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public FindingDetailResponse getFindingById(UUID id) {
        SecurityFinding finding = findingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityFinding", "id", id));

        List<FindingEvidenceResponse> evidence = evidenceRepository.findByFindingId(id).stream()
                .map(FindingEvidenceResponse::fromEntity)
                .toList();

        List<FindingReferenceResponse> references = referenceRepository.findByFindingId(id).stream()
                .map(FindingReferenceResponse::fromEntity)
                .toList();

        List<FindingCorrelationResponse> correlations = correlationRepository.findByFindingId(id).stream()
                .map(FindingCorrelationResponse::fromEntity)
                .toList();

        List<FindingCommentResponse> comments = commentRepository.findByFindingIdOrderByCreatedAtDesc(id).stream()
                .map(FindingCommentResponse::fromEntity)
                .toList();

        return FindingDetailResponse.builder()
                .finding(SecurityFindingResponse.fromEntity(finding))
                .evidence(evidence)
                .references(references)
                .correlations(correlations)
                .comments(comments)
                .build();
    }

    @Transactional
    public SecurityFindingResponse updateStatus(
            UUID id,
            UpdateFindingStatusRequest request,
            UserPrincipal currentUser,
            String ipAddress,
            String userAgent) {

        SecurityFinding finding = findingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityFinding", "id", id));

        FindingStatus currentStatus = finding.getStatus();
        FindingStatus newStatus = request.getNewStatus();

        validateStatusTransition(currentStatus, newStatus);

        finding.setStatus(newStatus);
        findingRepository.save(finding);

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        if (request.getComment() != null && !request.getComment().isBlank()) {
            commentRepository.save(FindingComment.builder()
                    .finding(finding)
                    .author(user)
                    .authorEmail(user.getEmail())
                    .comment("Status changed to " + newStatus + ": " + request.getComment())
                    .build());
        }

        auditService.logEvent(
                user.getId(),
                user.getEmail(),
                AuditEventType.TARGET_UPDATED,
                "SECURITY_FINDING",
                id.toString(),
                "UPDATE_FINDING_STATUS",
                "Updated status of finding '" + finding.getTitle() + "' from " + currentStatus + " to " + newStatus,
                ipAddress,
                userAgent
        );

        return SecurityFindingResponse.fromEntity(finding);
    }

    @Transactional
    public FindingCommentResponse addComment(
            UUID id,
            CreateFindingCommentRequest request,
            UserPrincipal currentUser) {

        SecurityFinding finding = findingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityFinding", "id", id));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        FindingComment comment = commentRepository.save(FindingComment.builder()
                .finding(finding)
                .author(user)
                .authorEmail(user.getEmail())
                .comment(request.getComment())
                .build());

        return FindingCommentResponse.fromEntity(comment);
    }

    @Transactional(readOnly = true)
    public FindingSummaryResponse getSummary(UUID assessmentId) {
        long critical = findingRepository.countByAssessmentIdAndSeverity(assessmentId, FindingSeverity.CRITICAL);
        long high = findingRepository.countByAssessmentIdAndSeverity(assessmentId, FindingSeverity.HIGH);
        long medium = findingRepository.countByAssessmentIdAndSeverity(assessmentId, FindingSeverity.MEDIUM);
        long low = findingRepository.countByAssessmentIdAndSeverity(assessmentId, FindingSeverity.LOW);
        long info = findingRepository.countByAssessmentIdAndSeverity(assessmentId, FindingSeverity.INFO);
        long total = findingRepository.countByAssessmentId(assessmentId);

        return FindingSummaryResponse.builder()
                .assessmentId(assessmentId)
                .totalFindings(total)
                .criticalCount(critical)
                .highCount(high)
                .mediumCount(medium)
                .lowCount(low)
                .infoCount(info)
                .build();
    }

    private void validateStatusTransition(FindingStatus current, FindingStatus next) {
        if (current == next) return;

        boolean valid = switch (current) {
            case OPEN -> true;
            case CONFIRMED -> true;
            case FALSE_POSITIVE, ACCEPTED_RISK -> next == FindingStatus.OPEN;
            case RESOLVED -> next == FindingStatus.REOPENED;
            case REOPENED -> true;
            default -> true;
        };

        if (!valid) {
            throw new BadRequestException("Invalid status transition from " + current + " to " + next);
        }
    }
}
