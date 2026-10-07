package com.aegis.retest.service;

import com.aegis.audit.AuditService;
import com.aegis.audit.AuditEventType;
import com.aegis.finding.entity.FindingStatus;
import com.aegis.finding.entity.SecurityFinding;
import com.aegis.finding.repository.SecurityFindingRepository;
import com.aegis.retest.dto.*;
import com.aegis.retest.entity.*;
import com.aegis.retest.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RetestService {

    private final RetestRepository retestRepository;
    private final RetestCheckRepository checkRepository;
    private final RetestEvidenceRepository evidenceRepository;
    private final DefenseValidationRepository validationRepository;
    private final ValidationResultRepository resultRepository;
    private final RemediationStatusHistoryRepository historyRepository;
    private final SecurityFindingRepository findingRepository;
    private final RetestExecutionService retestExecutionService;
    private final AuditService auditService;

    public RetestService(RetestRepository retestRepository,
                         RetestCheckRepository checkRepository,
                         RetestEvidenceRepository evidenceRepository,
                         DefenseValidationRepository validationRepository,
                         ValidationResultRepository resultRepository,
                         RemediationStatusHistoryRepository historyRepository,
                         SecurityFindingRepository findingRepository,
                         RetestExecutionService retestExecutionService,
                         AuditService auditService) {
        this.retestRepository = retestRepository;
        this.checkRepository = checkRepository;
        this.evidenceRepository = evidenceRepository;
        this.validationRepository = validationRepository;
        this.resultRepository = resultRepository;
        this.historyRepository = historyRepository;
        this.findingRepository = findingRepository;
        this.retestExecutionService = retestExecutionService;
        this.auditService = auditService;
    }

    @Transactional
    public RetestResponseDto createRetest(UUID findingId, CreateRetestRequestDto request, String username) {
        SecurityFinding finding = findingRepository.findById(findingId)
                .orElseThrow(() -> new IllegalArgumentException("Finding not found: " + findingId));

        // Check if active retest already exists (Idempotency / Concurrent retest prevention)
        List<Retest> activeRetests = retestRepository.findByFindingIdAndStatusIn(
                findingId, Arrays.asList(RetestStatus.QUEUED, RetestStatus.VALIDATING, RetestStatus.RUNNING)
        );
        if (!activeRetests.isEmpty()) {
            Retest existing = activeRetests.get(0);
            return getRetestDto(existing);
        }

        Retest retest = Retest.builder()
                .finding(finding)
                .assessment(finding.getAssessment())
                .target(finding.getAssessment().getTarget())
                .requestedBy(username != null ? username : "security_analyst")
                .status(RetestStatus.QUEUED)
                .reason(request.getReason() != null ? request.getReason() : "Controlled verification of security fix.")
                .authorizationConfirmed(request.isAuthorizationConfirmed())
                .build();

        retest = retestRepository.save(retest);

        // Update finding status to RETEST_PENDING
        String prevStatus = finding.getStatus() != null ? finding.getStatus().name() : "OPEN";
        finding.setStatus(FindingStatus.RETEST_PENDING);
        findingRepository.save(finding);

        RemediationStatusHistory history = RemediationStatusHistory.builder()
                .finding(finding)
                .previousStatus(prevStatus)
                .newStatus(FindingStatus.RETEST_PENDING.name())
                .changedBy(username != null ? username : "security_analyst")
                .reason("Controlled retest queued.")
                .source("USER_ACTION")
                .build();
        historyRepository.save(history);

        auditService.logEvent(null, username, AuditEventType.RETEST_CREATED, "RETEST", retest.getId().toString(), "RETEST_QUEUED", "Retest queued for finding " + findingId, "127.0.0.1", "AEGIS-Analyst");

        return getRetestDto(retest);
    }

    @Transactional
    public RetestResponseDto startRetest(UUID retestId, String username) {
        Retest retest = retestRepository.findById(retestId)
                .orElseThrow(() -> new IllegalArgumentException("Retest not found: " + retestId));

        if (retest.getStatus() == RetestStatus.RUNNING || retest.getStatus() == RetestStatus.COMPLETED) {
            return getRetestDto(retest);
        }

        retestExecutionService.executeRetestAsync(retest.getId());
        return getRetestDto(retest);
    }

    @Transactional
    public Optional<RetestResponseDto> cancelRetest(UUID retestId, String username) {
        return retestRepository.findById(retestId).map(retest -> {
            if (retest.getStatus() == RetestStatus.QUEUED || retest.getStatus() == RetestStatus.RUNNING || retest.getStatus() == RetestStatus.DRAFT) {
                retest.setStatus(RetestStatus.CANCELLED);
                retest.setCompletedAt(OffsetDateTime.now());
                retestRepository.save(retest);
            }
            return getRetestDto(retest);
        });
    }

    @Transactional(readOnly = true)
    public List<RetestResponseDto> listRetestsForFinding(UUID findingId) {
        return retestRepository.findByFindingIdOrderByCreatedAtDesc(findingId).stream()
                .map(this::getRetestDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<RetestResponseDto> getRetestById(UUID retestId) {
        return retestRepository.findById(retestId).map(this::getRetestDto);
    }

    @Transactional(readOnly = true)
    public List<RetestCheckDto> getRetestChecks(UUID retestId) {
        return checkRepository.findByRetestIdOrderByCreatedAtAsc(retestId).stream()
                .map(RetestCheckDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RetestEvidenceDto> getRetestEvidence(UUID retestId) {
        return evidenceRepository.findByRetestIdOrderByCreatedAtAsc(retestId).stream()
                .map(RetestEvidenceDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<DefenseValidationDto> getRetestValidation(UUID retestId) {
        return validationRepository.findByRetestId(retestId).map(val -> {
            List<ValidationResultDto> results = resultRepository.findByValidationIdOrderByCreatedAtAsc(val.getId()).stream()
                    .map(ValidationResultDto::fromEntity)
                    .collect(Collectors.toList());
            return DefenseValidationDto.fromEntity(val, results);
        });
    }

    @Transactional(readOnly = true)
    public List<RemediationStatusHistoryDto> getFindingValidationHistory(UUID findingId) {
        return historyRepository.findByFindingIdOrderByCreatedAtDesc(findingId).stream()
                .map(RemediationStatusHistoryDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RetestDashboardMetricsDto getDashboardMetrics() {
        long totalRetests = retestRepository.count();
        long openFindings = findingRepository.count();
        long awaitingRetest = retestRepository.countByStatus(RetestStatus.QUEUED);
        long currentlyRetesting = retestRepository.countByStatus(RetestStatus.RUNNING);
        long fixedCount = validationRepository.countByValidationStatus(ValidationStatus.FIXED);
        long partiallyFixedCount = validationRepository.countByValidationStatus(ValidationStatus.PARTIALLY_FIXED);
        long notFixedCount = validationRepository.countByValidationStatus(ValidationStatus.NOT_FIXED);
        long regressedCount = validationRepository.countByValidationStatus(ValidationStatus.REGRESSED);
        long inconclusiveCount = validationRepository.countByValidationStatus(ValidationStatus.INCONCLUSIVE);

        return RetestDashboardMetricsDto.builder()
                .totalRetests(totalRetests)
                .openFindings(openFindings)
                .awaitingRetest(awaitingRetest)
                .currentlyRetesting(currentlyRetesting)
                .fixedCount(fixedCount)
                .partiallyFixedCount(partiallyFixedCount)
                .notFixedCount(notFixedCount)
                .regressedCount(regressedCount)
                .inconclusiveCount(inconclusiveCount)
                .build();
    }

    private RetestResponseDto getRetestDto(Retest retest) {
        List<RetestCheckDto> checks = checkRepository.findByRetestIdOrderByCreatedAtAsc(retest.getId()).stream()
                .map(RetestCheckDto::fromEntity)
                .collect(Collectors.toList());

        DefenseValidationDto validation = validationRepository.findByRetestId(retest.getId()).map(val -> {
            List<ValidationResultDto> results = resultRepository.findByValidationIdOrderByCreatedAtAsc(val.getId()).stream()
                    .map(ValidationResultDto::fromEntity)
                    .collect(Collectors.toList());
            return DefenseValidationDto.fromEntity(val, results);
        }).orElse(null);

        return RetestResponseDto.fromEntity(retest, checks, validation);
    }
}
