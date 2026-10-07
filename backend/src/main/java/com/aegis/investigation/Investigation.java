package com.aegis.investigation;

import com.aegis.detection.DetectionConfidence;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "investigations")
public class Investigation {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "incident_id", nullable = false, unique = true)
    private UUID incidentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InvestigationStatus status = InvestigationStatus.IN_PROGRESS;

    @Column(name = "primary_hypothesis", columnDefinition = "TEXT")
    private String primaryHypothesis;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private InvestigationConclusion conclusion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DetectionConfidence confidence = DetectionConfidence.MEDIUM;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    public Investigation() {
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

    public UUID getIncidentId() {
        return incidentId;
    }
    public void setIncidentId(UUID incidentId) {
        this.incidentId = incidentId;
    }

    public InvestigationStatus getStatus() {
        return status;
    }
    public void setStatus(InvestigationStatus status) {
        this.status = status;
    }

    public String getPrimaryHypothesis() {
        return primaryHypothesis;
    }
    public void setPrimaryHypothesis(String primaryHypothesis) {
        this.primaryHypothesis = primaryHypothesis;
    }

    public InvestigationConclusion getConclusion() {
        return conclusion;
    }
    public void setConclusion(InvestigationConclusion conclusion) {
        this.conclusion = conclusion;
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

    public OffsetDateTime getClosedAt() {
        return closedAt;
    }
    public void setClosedAt(OffsetDateTime closedAt) {
        this.closedAt = closedAt;
    }
}
