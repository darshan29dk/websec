package com.globalshield.fuzzing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkFindingRequest {

    @NotNull(message = "Finding ID is required")
    private UUID findingId;

    private UUID investigationId;

    private boolean createRemediationPlan;

    private String remediationPlanTitle;
}
