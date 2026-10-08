package com.globalshield.incident;

import com.globalshield.event.SourceIpConfidence;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_incidents")
public class SecurityIncident {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentConfidence confidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IncidentStatus status = IncidentStatus.NEW;

    @Column(name = "correlation_key", nullable = false, length = 512)
    private String correlationKey;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_ip_confidence", nullable = false, length = 20)
    private SourceIpConfidence sourceIpConfidence = SourceIpConfidence.UNKNOWN;

    @Column(name = "first_observed_at", nullable = false)
    private OffsetDateTime firstObservedAt;

    @Column(name = "last_observed_at", nullable = false)
    private OffsetDateTime lastObservedAt;

    @Column(name = "created_by", nullable = false, length = 255)
    private String createdBy = "SYSTEM";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public SecurityIncident() {
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

    public UUID getTargetId() {
        return targetId;
    }
    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }

    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public IncidentSeverity getSeverity() {
        return severity;
    }
    public void setSeverity(IncidentSeverity severity) {
        this.severity = severity;
    }

    public IncidentConfidence getConfidence() {
        return confidence;
    }
    public void setConfidence(IncidentConfidence confidence) {
        this.confidence = confidence;
    }

    public IncidentStatus getStatus() {
        return status;
    }
    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public String getCorrelationKey() {
        return correlationKey;
    }
    public void setCorrelationKey(String correlationKey) {
        this.correlationKey = correlationKey;
    }

    public String getSourceIp() {
        return sourceIp;
    }
    public void setSourceIp(String sourceIp) {
        this.sourceIp = sourceIp;
    }

    public SourceIpConfidence getSourceIpConfidence() {
        return sourceIpConfidence;
    }
    public void setSourceIpConfidence(SourceIpConfidence sourceIpConfidence) {
        this.sourceIpConfidence = sourceIpConfidence;
    }

    public OffsetDateTime getFirstObservedAt() {
        return firstObservedAt;
    }
    public void setFirstObservedAt(OffsetDateTime firstObservedAt) {
        this.firstObservedAt = firstObservedAt;
    }

    public OffsetDateTime getLastObservedAt() {
        return lastObservedAt;
    }
    public void setLastObservedAt(OffsetDateTime lastObservedAt) {
        this.lastObservedAt = lastObservedAt;
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
