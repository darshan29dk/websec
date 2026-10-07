package com.aegis.forensics.dto;

import com.aegis.forensics.enums.CasePriority;
import com.aegis.forensics.enums.CaseStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ForensicCaseResponse {
    private UUID id;
    private String uuid;
    private UUID incidentId;
    private UUID assessmentId;
    private UUID targetId;
    private String targetName;
    private String caseNumber;
    private String title;
    private CaseStatus status;
    private CasePriority priority;
    private String createdByEmail;
    private Instant openedAt;
    private Instant closedAt;
    private Instant createdAt;
    private Instant updatedAt;

    private long evidenceCount;
    private long unverifiedEvidenceCount;
}
