package com.aegis.finding.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class FindingSummaryResponse {
    private UUID assessmentId;
    private long totalFindings;
    private long criticalCount;
    private long highCount;
    private long mediumCount;
    private long lowCount;
    private long infoCount;
}
