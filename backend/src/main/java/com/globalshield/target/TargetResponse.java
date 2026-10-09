package com.globalshield.target;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetResponse {
    private UUID id;
    private String name;
    private TargetType targetType;
    private String primaryUrl;
    private String description;
    private TargetStatus status;
    private UUID createdById;
    private String createdByName;
    private boolean authorized;
    private LocalDate authorizationExpirationDate;
    private List<TargetScopeResponse> scopes;
    private List<TargetAuthorizationResponse> authorizations;
    private Instant createdAt;
    private Instant updatedAt;

    public static TargetResponse fromEntity(SecurityTarget target) {
        if (target == null) return null;

        List<TargetScopeResponse> scopeResponses = target.getScopes() != null ?
                target.getScopes().stream().map(TargetScopeResponse::fromEntity).toList() : List.of();

        List<TargetAuthorizationResponse> authResponses = target.getAuthorizations() != null ?
                target.getAuthorizations().stream().map(TargetAuthorizationResponse::fromEntity).toList() : List.of();

        boolean hasActiveAuth = authResponses.stream().anyMatch(TargetAuthorizationResponse::isActive);
        LocalDate latestExp = authResponses.stream()
                .filter(TargetAuthorizationResponse::isActive)
                .map(TargetAuthorizationResponse::getExpirationDate)
                .max(LocalDate::compareTo)
                .orElse(null);

        return TargetResponse.builder()
                .id(target.getId())
                .name(target.getName())
                .targetType(target.getTargetType())
                .primaryUrl(target.getPrimaryUrl())
                .description(target.getDescription())
                .status(target.getStatus())
                .createdById(target.getCreatedBy() != null ? target.getCreatedBy().getId() : null)
                .createdByName(target.getCreatedBy() != null ? target.getCreatedBy().getDisplayName() : null)
                .authorized(hasActiveAuth)
                .authorizationExpirationDate(latestExp)
                .scopes(scopeResponses)
                .authorizations(authResponses)
                .createdAt(target.getCreatedAt())
                .updatedAt(target.getUpdatedAt())
                .build();
    }
}
