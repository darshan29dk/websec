package com.aegis.detection;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "detection_matches")
public class DetectionMatch {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DetectionSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DetectionConfidence confidence;

    @Column(name = "matched_at", nullable = false)
    private OffsetDateTime matchedAt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String evidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchStatus status = MatchStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public DetectionMatch() {
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
        if (matchedAt == null) {
            matchedAt = OffsetDateTime.now();
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

    public UUID getRuleId() {
        return ruleId;
    }
    public void setRuleId(UUID ruleId) {
        this.ruleId = ruleId;
    }

    public UUID getTargetId() {
        return targetId;
    }
    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }

    public UUID getEventId() {
        return eventId;
    }
    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public DetectionSeverity getSeverity() {
        return severity;
    }
    public void setSeverity(DetectionSeverity severity) {
        this.severity = severity;
    }

    public DetectionConfidence getConfidence() {
        return confidence;
    }
    public void setConfidence(DetectionConfidence confidence) {
        this.confidence = confidence;
    }

    public OffsetDateTime getMatchedAt() {
        return matchedAt;
    }
    public void setMatchedAt(OffsetDateTime matchedAt) {
        this.matchedAt = matchedAt;
    }

    public String getEvidence() {
        return evidence;
    }
    public void setEvidence(String evidence) {
        this.evidence = evidence;
    }

    public MatchStatus getStatus() {
        return status;
    }
    public void setStatus(MatchStatus status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
