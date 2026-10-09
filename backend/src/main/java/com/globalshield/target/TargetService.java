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
public class TargetService {

    private final SecurityTargetRepository targetRepository;
    private final TargetScopeRepository scopeRepository;
    private final TargetAuthorizationRepository authorizationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

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
}
