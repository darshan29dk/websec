package com.aegis.investigation;

import com.aegis.detection.DetectionConfidence;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "investigation_evidence")
public class InvestigationEvidence {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "investigation_id", nullable = false)
    private UUID investigationId;

    @Column(name = "evidence_type", nullable = false, length = 50)
    private String evidenceType;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;

    @Column(name = "source_id", nullable = false, length = 255)
    private String sourceId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "observed_at", nullable = false)
    private OffsetDateTime observedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DetectionConfidence confidence = DetectionConfidence.HIGH;

    @Column(name = "integrity_hash", length = 128)
    private String integrityHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public InvestigationEvidence() {
    }

    @PrePersist
    public void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (uuid == null) {
            uuid = id.toString();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }
    public void setId(UUID id) {
        this.id = id;
    }

    public String getUuid() {
        return uuid;
    }
    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public UUID getInvestigationId() {
        return investigationId;
    }
    public void setInvestigationId(UUID investigationId) {
        this.investigationId = investigationId;
    }

    public String getEvidenceType() {
        return evidenceType;
    }
    public void setEvidenceType(String evidenceType) {
        this.evidenceType = evidenceType;
    }

    public String getSourceType() {
        return sourceType;
    }
    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public String getSourceId() {
        return sourceId;
    }
    public void setSourceId(String sourceId) {
        this.sourceId = sourceId;
    }

    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public OffsetDateTime getObservedAt() {
        return observedAt;
    }
    public void setObservedAt(OffsetDateTime observedAt) {
        this.observedAt = observedAt;
    }

    public DetectionConfidence getConfidence() {
        return confidence;
    }
    public void setConfidence(DetectionConfidence confidence) {
        this.confidence = confidence;
    }

    public String getIntegrityHash() {
        return integrityHash;
    }
    public void setIntegrityHash(String integrityHash) {
        this.integrityHash = integrityHash;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
