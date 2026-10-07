package com.aegis.investigation;

import com.aegis.detection.DetectionConfidence;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "investigation_hypotheses")
public class InvestigationHypothesis {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "investigation_id", nullable = false)
    private UUID investigationId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String statement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private HypothesisStatus status = HypothesisStatus.PROPOSED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DetectionConfidence confidence = DetectionConfidence.MEDIUM;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public InvestigationHypothesis() {
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
        if (updatedAt == null) {
            updatedAt = OffsetDateTime.now();
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = OffsetDateTime.now();
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

    public String getStatement() {
        return statement;
    }
    public void setStatement(String statement) {
        this.statement = statement;
    }

    public HypothesisStatus getStatus() {
        return status;
    }
    public void setStatus(HypothesisStatus status) {
        this.status = status;
    }

    public DetectionConfidence getConfidence() {
        return confidence;
    }
    public void setConfidence(DetectionConfidence confidence) {
        this.confidence = confidence;
    }

    public String getCreatedBy() {
        return createdBy;
    }
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
