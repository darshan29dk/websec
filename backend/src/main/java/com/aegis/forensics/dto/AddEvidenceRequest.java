package com.aegis.forensics.dto;

import com.aegis.forensics.enums.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class AddEvidenceRequest {

    @NotNull(message = "Evidence type is required")
    private EvidenceType evidenceType;

    @NotNull(message = "Source type is required")
    private EvidenceSourceType sourceType;

    private String sourceReference;
    private Instant eventTime;

    @NotBlank(message = "Provenance is required")
    private String provenance;

    @NotBlank(message = "Content is required")
    private String content;

    private String description;
    private String metadata;

    private EvidenceConfidence confidence = EvidenceConfidence.MEDIUM;
    private EvidenceClassification classification = EvidenceClassification.OBSERVED;
}
