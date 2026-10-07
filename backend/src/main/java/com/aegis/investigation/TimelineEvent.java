package com.aegis.investigation;

import com.aegis.detection.DetectionConfidence;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "timeline_events")
public class TimelineEvent {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "investigation_id", nullable = false)
    private UUID investigationId;

    @Column(name = "event_id")
    private UUID eventId;

    @Column(name = "event_time", nullable = false)
    private OffsetDateTime eventTime;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DetectionConfidence confidence = DetectionConfidence.HIGH;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public TimelineEvent() {
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

    public UUID getEventId() {
        return eventId;
    }
    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public OffsetDateTime getEventTime() {
        return eventTime;
    }
    public void setEventTime(OffsetDateTime eventTime) {
        this.eventTime = eventTime;
    }

    public String getEventType() {
        return eventType;
    }
    public void setEventType(String eventType) {
        this.eventType = eventType;
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

    public String getSource() {
        return source;
    }
    public void setSource(String source) {
        this.source = source;
    }

    public DetectionConfidence getConfidence() {
        return confidence;
    }
    public void setConfidence(DetectionConfidence confidence) {
        this.confidence = confidence;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
