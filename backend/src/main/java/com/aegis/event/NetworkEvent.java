package com.aegis.event;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "network_events")
public class NetworkEvent {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "security_event_id", nullable = false, unique = true)
    private UUID securityEventId;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(nullable = false)
    private OffsetDateTime timestamp;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Column(name = "source_port")
    private Integer sourcePort;

    @Column(name = "destination_ip", length = 45)
    private String destinationIp;

    @Column(name = "destination_port")
    private Integer destinationPort;

    @Column(nullable = false, length = 20)
    private String protocol;

    @Column(length = 20)
    private String direction;

    @Column(name = "bytes_in")
    private Long bytesIn;

    @Column(name = "bytes_out")
    private Long bytesOut;

    @Column(name = "connection_state", length = 50)
    private String connectionState;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_source", nullable = false, length = 50)
    private EventSource eventSource;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public NetworkEvent() {
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

    public UUID getSecurityEventId() {
        return securityEventId;
    }
    public void setSecurityEventId(UUID securityEventId) {
        this.securityEventId = securityEventId;
    }

    public UUID getTargetId() {
        return targetId;
    }
    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getSourceIp() {
        return sourceIp;
    }
    public void setSourceIp(String sourceIp) {
        this.sourceIp = sourceIp;
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

    public String getProtocol() {
        return protocol;
    }
    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getDirection() {
        return direction;
    }
    public void setDirection(String direction) {
        this.direction = direction;
    }

    public Long getBytesIn() {
        return bytesIn;
    }
    public void setBytesIn(Long bytesIn) {
        this.bytesIn = bytesIn;
    }

    public Long getBytesOut() {
        return bytesOut;
    }
    public void setBytesOut(Long bytesOut) {
        this.bytesOut = bytesOut;
    }

    public String getConnectionState() {
        return connectionState;
    }
    public void setConnectionState(String connectionState) {
        this.connectionState = connectionState;
    }

    public EventSource getEventSource() {
        return eventSource;
    }
    public void setEventSource(EventSource eventSource) {
        this.eventSource = eventSource;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
