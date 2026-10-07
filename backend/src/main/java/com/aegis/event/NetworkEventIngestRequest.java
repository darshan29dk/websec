package com.aegis.event;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public class NetworkEventIngestRequest {

    @NotNull
    private UUID targetId;

    private UUID assessmentId;
    private OffsetDateTime timestamp;

    private String sourceIp;
    private Integer sourcePort;
    private String destinationIp;
    private Integer destinationPort;

    @NotNull
    private String protocol = "TCP";

    private String direction;
    private Long bytesIn;
    private Long bytesOut;
    private String connectionState;

    @NotNull
    private EventSource eventSource = EventSource.NETWORK_SENSOR;

    public NetworkEventIngestRequest() {
    }

    // Getters and Setters
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
}
