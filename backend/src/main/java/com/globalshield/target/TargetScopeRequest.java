package com.globalshield.target;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetScopeRequest {

    @NotNull(message = "Scope type is required")
    private ScopeType scopeType;

    @NotBlank(message = "Scope value is required")
    private String scopeValue;

    @Builder.Default
    private boolean included = true;
}
