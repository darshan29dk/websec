package com.aegis.attacksurface.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AttackSurfaceSummaryResponse {
    private UUID assessmentId;
    private long totalAssets;
    private long totalTechnologies;
    private long totalWebApplications;
    private long totalEndpoints;
    private long totalApiEndpoints;
    private long totalRelationships;
}
