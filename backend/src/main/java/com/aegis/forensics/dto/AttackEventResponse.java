package com.aegis.forensics.dto;

import com.aegis.forensics.enums.AttackStage;
import com.aegis.forensics.enums.EvidenceClassification;
import com.aegis.forensics.enums.EvidenceConfidence;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AttackEventResponse {
    private UUID id;
    private UUID caseId;
    private UUID timelineEventId;
    private String eventType;
    private AttackStage stage;
    private Instant eventTime;
    private String sourceIp;
    private String targetEndpoint;
    private String httpMethod;
    private Integer statusCode;
    private UUID evidenceId;
    private EvidenceConfidence confidence;
    private EvidenceClassification classification;
    private String description;
    private Instant createdAt;
}
