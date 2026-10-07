package com.aegis.event;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_events")
public class SecurityEvent {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(name = "assessment_id")
    private UUID assessmentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private SecurityEventType eventType;

    @Column(name = "event_time", nullable = false)
    private OffsetDateTime eventTime;

    @Column(name = "observed_at", nullable = false)
    private OffsetDateTime observedAt;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_ip_confidence", nullable = false, length = 20)
    private SourceIpConfidence sourceIpConfidence = SourceIpConfidence.UNKNOWN;

    @Column(name = "source_port")
    private Integer sourcePort;

    @Column(name = "destination_ip", length = 45)
    private String destinationIp;

    @Column(name = "destination_port")
    private Integer destinationPort;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(length = 2048)
    private String url;

    @Column(length = 1024)
    private String path;

    @Column(name = "query_parameters", columnDefinition = "TEXT")
    private String queryParameters;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "request_size")
    private Long requestSize;

    @Column(name = "response_size")
    private Long responseSize;

    @Column(length = 20)
    private String protocol;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_source", nullable = false, length = 50)
    private EventSource eventSource;

    @Column(name = "raw_reference", length = 512)
    private String rawReference;

    @Column(name = "normalized_data", columnDefinition = "TEXT")
    private String normalizedData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public SecurityEvent() {
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
        if (observedAt == null) {
            observedAt = OffsetDateTime.now();
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

    public UUID getTargetId() {
        return targetId;
    }
    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }

    public UUID getAssessmentId() {
        return assessmentId;
    }
    public void setAssessmentId(UUID assessmentId) {
        this.assessmentId = assessmentId;
    }

    public SecurityEventType getEventType() {
        return eventType;
    }
    public void setEventType(SecurityEventType eventType) {
        this.eventType = eventType;
    }

    public OffsetDateTime getEventTime() {
        return eventTime;
    }
    public void setEventTime(OffsetDateTime eventTime) {
        this.eventTime = eventTime;
    }

    public OffsetDateTime getObservedAt() {
        return observedAt;
    }
    public void setObservedAt(OffsetDateTime observedAt) {
        this.observedAt = observedAt;
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

    public Integer getSourcePort() {
        return sourcePort;
    }
    public void setSourcePort(Integer sourcePort) {
        this.sourcePort = sourcePort;
    }

    public String getDestinationIp() {
        return destinationIp;
    }
    public void setDestinationIp(String destinationIp) {
        this.destinationIp = destinationIp;
    }

    public Integer getDestinationPort() {
        return destinationPort;
    }
    public void setDestinationPort(Integer destinationPort) {
        this.destinationPort = destinationPort;
    }

    public String getHttpMethod() {
        return httpMethod;
    }
    public void setHttpMethod(String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public String getUrl() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }

    public String getPath() {
        return path;
    }
    public void setPath(String path) {
        this.path = path;
    }

    public String getQueryParameters() {
        return queryParameters;
    }
    public void setQueryParameters(String queryParameters) {
        this.queryParameters = queryParameters;
    }

    public Integer getStatusCode() {
        return statusCode;
    }
    public void setStatusCode(Integer statusCode) {
        this.statusCode = statusCode;
    }

    public String getUserAgent() {
        return userAgent;
    }
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public Long getRequestSize() {
        return requestSize;
    }
    public void setRequestSize(Long requestSize) {
        this.requestSize = requestSize;
    }

    public Long getResponseSize() {
        return responseSize;
    }
    public void setResponseSize(Long responseSize) {
        this.responseSize = responseSize;
    }

    public String getProtocol() {
        return protocol;
    }
    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public EventSource getEventSource() {
        return eventSource;
    }
    public void setEventSource(EventSource eventSource) {
        this.eventSource = eventSource;
    }

    public String getRawReference() {
        return rawReference;
    }
    public void setRawReference(String rawReference) {
        this.rawReference = rawReference;
    }

    public String getNormalizedData() {
        return normalizedData;
    }
    public void setNormalizedData(String normalizedData) {
        this.normalizedData = normalizedData;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
