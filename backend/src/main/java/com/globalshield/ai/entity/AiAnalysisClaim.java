package com.globalshield.ai.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_analysis_claims")
public class AiAnalysisClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    @Column(name = "investigation_id", nullable = false)
    private Long investigationId;

    @Column(name = "claim_type", nullable = false)
    private String claimType; // OBSERVED_FACT, INFERENCE, HYPOTHESIS, RECOMMENDATION

    @Column(name = "claim_text", columnDefinition = "TEXT", nullable = false)
    private String claimText;

    private Double confidence;

    @Column(name = "validation_status", nullable = false)
    private String validationStatus = "SUPPORTED"; // SUPPORTED, PARTIALLY_SUPPORTED, UNSUPPORTED, NOT_VERIFIABLE

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public AiAnalysisClaim() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getUuid() { return uuid; }
    public void setUuid(UUID uuid) { this.uuid = uuid; }

    public Long getInvestigationId() { return investigationId; }
    public void setInvestigationId(Long investigationId) { this.investigationId = investigationId; }

    public String getClaimType() { return claimType; }
    public void setClaimType(String claimType) { this.claimType = claimType; }

    public String getClaimText() { return claimText; }
    public void setClaimText(String claimText) { this.claimText = claimText; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getValidationStatus() { return validationStatus; }
    public void setValidationStatus(String validationStatus) { this.validationStatus = validationStatus; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
