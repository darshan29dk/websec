package com.globalshield.security.tool;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ToolHealthReport {
    private String toolName;
    private String status; // OPERATIONAL, NOT_CONFIGURED, UNAVAILABLE, DEGRADED
    private String versionOrEndpoint;
    private String diagnosticMessage;
    private Instant checkedAt;
}
