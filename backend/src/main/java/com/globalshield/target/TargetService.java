package com.globalshield.target;

import com.globalshield.audit.AuditService;
import com.globalshield.audit.AuditEventType;
import com.globalshield.common.PageResponse;
import com.globalshield.exception.BadRequestException;
import com.globalshield.exception.DuplicateResourceException;
import com.globalshield.exception.ResourceNotFoundException;
import com.globalshield.security.UserPrincipal;
import com.globalshield.user.User;
import com.globalshield.user.UserRepository;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.assessment.dto.SecurityAssessmentResponse;
import com.globalshield.attacksurface.dto.WebEndpointResponse;
import com.globalshield.attacksurface.entity.WebEndpoint;
import com.globalshield.attacksurface.repository.WebEndpointRepository;
import com.globalshield.finding.entity.FindingSeverity;
import com.globalshield.finding.entity.FindingStatus;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.incident.IncidentStatus;
import com.globalshield.incident.SecurityIncidentRepository;
import com.globalshield.monitoring.entity.MonitoringConfiguration;
import com.globalshield.monitoring.repository.MonitoringConfigurationRepository;
import com.globalshield.posture.entity.SecurityPostureSnapshot;
import com.globalshield.posture.repository.SecurityPostureSnapshotRepository;
import com.globalshield.retest.entity.RetestStatus;
import com.globalshield.retest.repository.RetestRepository;
import com.globalshield.target.dto.BulkImportRequestDto;
import com.globalshield.target.dto.BulkImportResponseDto;
import com.globalshield.target.dto.TargetDashboardOverviewDto;
import com.globalshield.target.dto.TargetRiskEvaluationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.StringReader;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TargetService {

    private final SecurityTargetRepository targetRepository;
    private final TargetScopeRepository scopeRepository;
    private final TargetAuthorizationRepository authorizationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final TargetRiskCalculationService riskCalculationService;
    private final WebEndpointRepository endpointRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final SecurityFindingRepository findingRepository;
    private final RetestRepository retestRepository;
    private final SecurityIncidentRepository incidentRepository;
    private final MonitoringConfigurationRepository monitoringRepository;
    private final SecurityPostureSnapshotRepository postureRepository;

    @Transactional
    public TargetResponse createTarget(TargetRequest request, UserPrincipal currentUser, String ipAddress, String userAgent) {
        String normalizedUrl = UrlValidatorUtil.validateAndNormalizeUrl(request.getPrimaryUrl());

        if (targetRepository.existsByPrimaryUrlAndStatusNot(normalizedUrl, TargetStatus.ARCHIVED)) {
            throw new DuplicateResourceException("An active security target with primary URL '" + normalizedUrl + "' already exists");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        SecurityTarget target = SecurityTarget.builder()
                .name(request.getName().trim())
                .targetType(TargetType.WEB_URL)
                .primaryUrl(normalizedUrl)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .status(TargetStatus.ACTIVE)
                .createdBy(user)
                .build();

        target = targetRepository.save(target);

        // Create default scope record matching primary URL
        TargetScope defaultScope = TargetScope.builder()
                .target(target)
                .scopeType(ScopeType.URL)
                .scopeValue(normalizedUrl)
                .included(true)
                .build();
        scopeRepository.save(defaultScope);

        auditService.logEvent(
                user.getId(),
                user.getEmail(),
                AuditEventType.TARGET_CREATED,
                "SecurityTarget",
                target.getId().toString(),
                "TARGET_CREATED",
                "Created target '" + target.getName() + "' with URL " + target.getPrimaryUrl(),
                ipAddress,
                userAgent
        );

        return getTargetById(target.getId());
    }

    @Transactional(readOnly = true)
    public PageResponse<TargetResponse> getTargets(int page, int size, TargetStatus status, String search) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SecurityTarget> targetsPage;
        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim();
            if (status != null) {
                targetsPage = targetRepository.findByStatusAndNameContainingIgnoreCaseOrStatusAndPrimaryUrlContainingIgnoreCase(
                        status, q, status, q, pageRequest
                );
            } else {
                targetsPage = targetRepository.findByNameContainingIgnoreCaseOrPrimaryUrlContainingIgnoreCase(
                        q, q, pageRequest
                );
            }
        } else if (status != null) {
            targetsPage = targetRepository.findByStatus(status, pageRequest);
        } else {
            targetsPage = targetRepository.findAll(pageRequest);
        }
        Page<TargetResponse> dtoPage = targetsPage.map(TargetResponse::fromEntity);
        return PageResponse.from(dtoPage);
    }

    @Transactional(readOnly = true)
    public TargetResponse getTargetById(UUID id) {
        SecurityTarget target = targetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", id));
        return TargetResponse.fromEntity(target);
    }

    @Transactional
    public TargetResponse updateTarget(UUID id, TargetRequest request, UserPrincipal currentUser, String ipAddress, String userAgent) {
        SecurityTarget target = targetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", id));

        String normalizedUrl = UrlValidatorUtil.validateAndNormalizeUrl(request.getPrimaryUrl());

        if (!target.getPrimaryUrl().equalsIgnoreCase(normalizedUrl) &&
            targetRepository.existsByPrimaryUrlAndStatusNot(normalizedUrl, TargetStatus.ARCHIVED)) {
            throw new DuplicateResourceException("An active security target with primary URL '" + normalizedUrl + "' already exists");
        }

        target.setName(request.getName().trim());
        target.setPrimaryUrl(normalizedUrl);
        target.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        target = targetRepository.save(target);

        auditService.logEvent(
                currentUser.getId(),
                currentUser.getEmail(),
                AuditEventType.TARGET_UPDATED,
                "SecurityTarget",
                target.getId().toString(),
                "TARGET_UPDATED",
                "Updated target '" + target.getName() + "'",
                ipAddress,
                userAgent
        );

        return getTargetById(target.getId());
    }

    @Transactional
    public TargetResponse disableTarget(UUID id, UserPrincipal currentUser, String ipAddress, String userAgent) {
        SecurityTarget target = targetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", id));

        target.setStatus(TargetStatus.DISABLED);
        target = targetRepository.save(target);

        auditService.logEvent(
                currentUser.getId(),
                currentUser.getEmail(),
                AuditEventType.TARGET_DISABLED,
                "SecurityTarget",
                target.getId().toString(),
                "TARGET_DISABLED",
                "Disabled target '" + target.getName() + "'",
                ipAddress,
                userAgent
        );

        return getTargetById(target.getId());
    }

    @Transactional
    public TargetAuthorizationResponse addAuthorization(
            UUID targetId,
            TargetAuthorizationRequest request,
            UserPrincipal currentUser,
            String ipAddress,
            String userAgent) {

        SecurityTarget target = targetRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", targetId));

        if (request.getExpirationDate().isBefore(request.getAuthorizationDate())) {
            throw new BadRequestException("Authorization expiration date cannot be before authorization date");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        TargetAuthorization auth = TargetAuthorization.builder()
                .target(target)
                .authorizationType(request.getAuthorizationType())
                .authorizationStatement(request.getAuthorizationStatement().trim())
                .authorizedBy(user)
                .authorizationDate(request.getAuthorizationDate())
                .expirationDate(request.getExpirationDate())
                .build();

        auth = authorizationRepository.save(auth);

        auditService.logEvent(
                user.getId(),
                user.getEmail(),
                AuditEventType.AUTHORIZATION_CREATED,
                "TargetAuthorization",
                auth.getId().toString(),
                "AUTHORIZATION_CREATED",
                "Created authorization type " + auth.getAuthorizationType() + " for target " + target.getName(),
                ipAddress,
                userAgent
        );

        return TargetAuthorizationResponse.fromEntity(auth);
    }

    @Transactional(readOnly = true)
    public List<TargetAuthorizationResponse> getAuthorizations(UUID targetId) {
        if (!targetRepository.existsById(targetId)) {
            throw new ResourceNotFoundException("SecurityTarget", "id", targetId);
        }
        return authorizationRepository.findByTargetIdOrderByCreatedAtDesc(targetId).stream()
                .map(TargetAuthorizationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TargetScopeResponse addScope(UUID targetId, TargetScopeRequest request) {
        SecurityTarget target = targetRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", targetId));

        TargetScope scope = TargetScope.builder()
                .target(target)
                .scopeType(request.getScopeType())
                .scopeValue(request.getScopeValue().trim())
                .included(request.isIncluded())
                .build();

        scope = scopeRepository.save(scope);
        return TargetScopeResponse.fromEntity(scope);
    }

    @Transactional(readOnly = true)
    public List<TargetScopeResponse> getScopes(UUID targetId) {
        if (!targetRepository.existsById(targetId)) {
            throw new ResourceNotFoundException("SecurityTarget", "id", targetId);
        }
        return scopeRepository.findByTargetId(targetId).stream()
                .map(TargetScopeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WebEndpointResponse> getTargetEndpoints(UUID targetId) {
        if (!targetRepository.existsById(targetId)) {
            throw new ResourceNotFoundException("SecurityTarget", "id", targetId);
        }
        List<WebEndpoint> endpoints = endpointRepository.findByAssessmentTargetId(targetId);
        return endpoints.stream().map(WebEndpointResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public TargetDashboardOverviewDto getTargetDashboard(UUID targetId) {
        SecurityTarget target = targetRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", targetId));

        TargetResponse targetResponse = TargetResponse.fromEntity(target);
        TargetRiskEvaluationDto riskEval = riskCalculationService.evaluateTargetRisk(targetId);

        long endpointsCount = endpointRepository.countByAssessmentTargetId(targetId);
        List<SecurityAssessment> assessments = assessmentRepository.findByTargetIdOrderByCreatedAtDesc(targetId);
        SecurityAssessmentResponse latestAssessment = assessments.isEmpty() ? null : SecurityAssessmentResponse.fromEntity(assessments.get(0));

        List<SecurityFinding> findings = findingRepository.findByAssessmentTargetId(targetId);
        List<SecurityFinding> openFindings = findings.stream()
                .filter(f -> f.getStatus() != FindingStatus.RESOLVED &&
                             f.getStatus() != FindingStatus.FIXED &&
                             f.getStatus() != FindingStatus.FALSE_POSITIVE)
                .toList();

        long criticalOpen = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.CRITICAL).count();
        long highOpen = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.HIGH).count();
        long mediumOpen = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.MEDIUM).count();
        long lowOpen = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.LOW || f.getSeverity() == FindingSeverity.INFO).count();
        long resolved = findings.stream().filter(f -> f.getStatus() == FindingStatus.RESOLVED || f.getStatus() == FindingStatus.FIXED).count();

        long verifiedFixes = retestRepository.findByTargetIdOrderByCreatedAtDesc(targetId).stream()
                .filter(r -> r.getStatus() == RetestStatus.COMPLETED)
                .count();

        long activeIncidents = incidentRepository.findAll().stream()
                .filter(i -> targetId.equals(i.getTargetId()) &&
                             (i.getStatus() == IncidentStatus.NEW || i.getStatus() == IncidentStatus.OPEN || i.getStatus() == IncidentStatus.INVESTIGATING))
                .count();

        Optional<MonitoringConfiguration> monOpt = monitoringRepository.findByTargetId(targetId);
        boolean monEnabled = monOpt.map(MonitoringConfiguration::isEnabled).orElse(false);
        String monFreq = monOpt.map(m -> m.getFrequency() != null ? m.getFrequency().name() : "DAILY").orElse(null);
        String monStatus = monOpt.map(m -> m.getStatus() != null ? m.getStatus().name() : "ACTIVE").orElse("NOT_CONFIGURED");

        Optional<SecurityPostureSnapshot> postureOpt = postureRepository.findTopByTargetIdOrderByCalculatedAtDesc(targetId);
        Integer postureScore = postureOpt.map(SecurityPostureSnapshot::getOverallScore).orElse(riskEval.getRiskScore());
        String postureLevel = postureOpt.map(p -> p.getRiskLevel().name()).orElse(riskEval.getRiskCategory());

        List<String> recentActivity = new ArrayList<>();
        if (!assessments.isEmpty()) {
            SecurityAssessment a = assessments.get(0);
            recentActivity.add("Latest assessment: " + (a.getProfile() != null ? a.getProfile().getName() : "Standard") + " (" + a.getStatus() + ")");
        }
        if (verifiedFixes > 0) {
            recentActivity.add(verifiedFixes + " remediation fix(es) verified through retesting.");
        }
        if (activeIncidents > 0) {
            recentActivity.add(activeIncidents + " active security incident(s) correlated.");
        }

        return TargetDashboardOverviewDto.builder()
                .target(targetResponse)
                .riskEvaluation(riskEval)
                .discoveredEndpointsCount(endpointsCount)
                .totalAssessmentsCount(assessments.size())
                .latestAssessment(latestAssessment)
                .uniqueOpenFindings(openFindings.size())
                .criticalOpenFindings(criticalOpen)
                .highOpenFindings(highOpen)
                .mediumOpenFindings(mediumOpen)
                .lowOpenFindings(lowOpen)
                .resolvedFindings(resolved)
                .verifiedFixes(verifiedFixes)
                .activeIncidents(activeIncidents)
                .monitoringEnabled(monEnabled)
                .monitoringFrequency(monFreq)
                .monitoringStatus(monStatus)
                .postureScore(postureScore)
                .postureRiskLevel(postureLevel)
                .recentActivity(recentActivity)
                .build();
    }

    @Transactional
    public BulkImportResponseDto bulkImportTargets(BulkImportRequestDto request, UserPrincipal currentUser, String ipAddress, String userAgent) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        List<BulkImportRequestDto.BulkImportEntryDto> entries = new ArrayList<>();
        if (request.getEntries() != null && !request.getEntries().isEmpty()) {
            entries.addAll(request.getEntries());
        } else if (request.getCsvContent() != null && !request.getCsvContent().trim().isEmpty()) {
            try (BufferedReader reader = new BufferedReader(new StringReader(request.getCsvContent()))) {
                String line;
                boolean isHeader = true;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) continue;
                    String[] parts = line.split(",", -1);
                    if (isHeader) {
                        isHeader = false;
                        if (parts.length > 0 && (parts[0].equalsIgnoreCase("name") || parts[0].equalsIgnoreCase("website"))) {
                            continue;
                        }
                    }
                    String name = parts.length > 0 ? parts[0].trim() : "";
                    String url = parts.length > 1 ? parts[1].trim() : "";
                    String desc = parts.length > 2 ? parts[2].trim() : "";
                    entries.add(new BulkImportRequestDto.BulkImportEntryDto(name, url, desc));
                }
            } catch (Exception e) {
                throw new BadRequestException("Failed to parse CSV content: " + e.getMessage());
            }
        }

        if (entries.isEmpty()) {
            throw new BadRequestException("No website records provided for bulk import.");
        }

        List<TargetResponse> successful = new ArrayList<>();
        List<BulkImportResponseDto.BulkImportConflictDto> duplicates = new ArrayList<>();
        List<BulkImportResponseDto.BulkImportFailureDto> failed = new ArrayList<>();
        Set<String> seenUrls = new HashSet<>();

        for (BulkImportRequestDto.BulkImportEntryDto entry : entries) {
            String name = entry.getName() != null ? entry.getName().trim() : "";
            String rawUrl = entry.getPrimaryUrl() != null ? entry.getPrimaryUrl().trim() : "";
            String desc = entry.getDescription() != null ? entry.getDescription().trim() : null;

            if (name.length() < 2) {
                failed.add(new BulkImportResponseDto.BulkImportFailureDto(name, rawUrl, "Website name must be at least 2 characters."));
                continue;
            }

            if (rawUrl.isEmpty()) {
                failed.add(new BulkImportResponseDto.BulkImportFailureDto(name, rawUrl, "Primary URL is required."));
                continue;
            }

            String normalizedUrl;
            try {
                normalizedUrl = UrlValidatorUtil.validateAndNormalizeUrl(rawUrl);
            } catch (Exception e) {
                failed.add(new BulkImportResponseDto.BulkImportFailureDto(name, rawUrl, "Invalid URL format: " + e.getMessage()));
                continue;
            }

            if (seenUrls.contains(normalizedUrl)) {
                duplicates.add(new BulkImportResponseDto.BulkImportConflictDto(name, normalizedUrl, "Duplicate website URL within the current import batch."));
                continue;
            }

            if (targetRepository.existsByPrimaryUrlAndStatusNot(normalizedUrl, TargetStatus.ARCHIVED)) {
                duplicates.add(new BulkImportResponseDto.BulkImportConflictDto(name, normalizedUrl, "Website with URL '" + normalizedUrl + "' already exists in GlobalShield."));
                continue;
            }

            seenUrls.add(normalizedUrl);

            SecurityTarget target = SecurityTarget.builder()
                    .name(name)
                    .targetType(TargetType.WEB_URL)
                    .primaryUrl(normalizedUrl)
                    .description(desc)
                    .status(TargetStatus.ACTIVE)
                    .createdBy(user)
                    .build();

            target = targetRepository.save(target);

            TargetScope defaultScope = TargetScope.builder()
                    .target(target)
                    .scopeType(ScopeType.URL)
                    .scopeValue(normalizedUrl)
                    .included(true)
                    .build();
            scopeRepository.save(defaultScope);

            successful.add(TargetResponse.fromEntity(target));
        }

        if (!successful.isEmpty()) {
            auditService.logEvent(
                    user.getId(),
                    user.getEmail(),
                    AuditEventType.TARGET_CREATED,
                    "SecurityTarget",
                    "BULK_IMPORT",
                    "TARGETS_BULK_IMPORTED",
                    "Successfully bulk-imported " + successful.size() + " website target(s).",
                    ipAddress,
                    userAgent
            );
        }

        String summary = String.format("Processed %d website(s): %d registered successfully, %d duplicate(s) skipped, %d failed.",
                entries.size(), successful.size(), duplicates.size(), failed.size());

        return BulkImportResponseDto.builder()
                .totalRecords(entries.size())
                .importedCount(successful.size())
                .duplicateCount(duplicates.size())
                .skippedCount(duplicates.size())
                .failedCount(failed.size())
                .successfulRecords(successful)
                .duplicateRecords(duplicates)
                .failedRecords(failed)
                .summary(summary)
                .build();
    }
}

