package com.globalshield.forensics.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ApplicationForensicEventResponse {
    private UUID id;
    private UUID caseId;
    private UUID evidenceId;
    private Instant eventTime;
    private String application;
    private String severity;
    private String eventType;
    private String message;
    private String requestId;
    private String sessionId;
    private String userIdReference;
    private String sourceIp;
    private String endpoint;
    private String metadata;
    private Instant createdAt;
}
