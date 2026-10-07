package com.aegis.forensics.dto;

import com.aegis.forensics.enums.*;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EvidenceResponse {
    private UUID id;
    private String uuid;
    private UUID caseId;
    private EvidenceType evidenceType;
    private EvidenceSourceType sourceType;
    private String sourceReference;
    private Instant eventTime;
    private Instant collectionTime;
    private String contentHash;
    private IntegrityStatus integrityStatus;
    private EvidenceConfidence confidence;
    private EvidenceClassification classification;
    private String provenance;
    private String description;
    private String metadata;
    private Instant createdAt;
}
