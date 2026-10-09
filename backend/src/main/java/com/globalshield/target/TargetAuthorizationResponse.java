package com.globalshield.target;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetAuthorizationResponse {
    private UUID id;
    private UUID targetId;
    private AuthorizationType authorizationType;
    private String authorizationStatement;
    private UUID authorizedById;
    private String authorizedByName;
    private LocalDate authorizationDate;
    private LocalDate expirationDate;
    private boolean active;
    private Instant createdAt;

    public static TargetAuthorizationResponse fromEntity(TargetAuthorization auth) {
        if (auth == null) return null;
        return TargetAuthorizationResponse.builder()
                .id(auth.getId())
                .targetId(auth.getTarget() != null ? auth.getTarget().getId() : null)
                .authorizationType(auth.getAuthorizationType())
                .authorizationStatement(auth.getAuthorizationStatement())
                .authorizedById(auth.getAuthorizedBy() != null ? auth.getAuthorizedBy().getId() : null)
                .authorizedByName(auth.getAuthorizedBy() != null ? auth.getAuthorizedBy().getDisplayName() : null)
                .authorizationDate(auth.getAuthorizationDate())
                .expirationDate(auth.getExpirationDate())
                .active(auth.isValid())
                .createdAt(auth.getCreatedAt())
                .build();
    }
}
