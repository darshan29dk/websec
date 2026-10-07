package com.aegis.forensics.dto;

import com.aegis.forensics.enums.IntegrityStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EvidenceVerificationResponse {
    private UUID evidenceId;
    private String storedHash;
    private String calculatedHash;
    private IntegrityStatus status;
    private Instant verifiedAt;
    private String message;
}
