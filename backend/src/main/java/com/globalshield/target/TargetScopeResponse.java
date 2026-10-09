package com.globalshield.target;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetScopeResponse {
    private UUID id;
    private UUID targetId;
    private ScopeType scopeType;
    private String scopeValue;
    private boolean included;
    private Instant createdAt;

    public static TargetScopeResponse fromEntity(TargetScope scope) {
        if (scope == null) return null;
        return TargetScopeResponse.builder()
                .id(scope.getId())
                .targetId(scope.getTarget() != null ? scope.getTarget().getId() : null)
                .scopeType(scope.getScopeType())
                .scopeValue(scope.getScopeValue())
                .included(scope.isIncluded())
                .createdAt(scope.getCreatedAt())
                .build();
    }
}
