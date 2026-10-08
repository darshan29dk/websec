package com.globalshield.event;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public class HttpEventIngestRequest {

    @NotNull
    private UUID targetId;

    private UUID assessmentId;

    private OffsetDateTime timestamp;

    private String sourceIp;
    private Integer sourcePort;
    private String destinationIp;
    private Integer destinationPort;

    @NotNull
    private String method;

    @NotNull
    private String scheme = "http";

    @NotNull
    private String host;

    @NotNull
    private Integer port = 80;

    @NotNull
    private String path = "/";

    private String queryString;
    private Integer statusCode;
    private String requestHeaders;
    private String responseHeaders;
    private String requestBody;
    private String responseBody;
    private String userAgent;
    private String contentType;
    private Long contentLength;
    private String tlsVersion;

    @NotNull
    private EventSource eventSource = EventSource.APPLICATION_LOG;

    public HttpEventIngestRequest() {
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

    public String getMethod() {
        return method;
    }
    public void setMethod(String method) {
        this.method = method;
    }

    public String getScheme() {
        return scheme;
    }
    public void setScheme(String scheme) {
        this.scheme = scheme;
    }

    public String getHost() {
        return host;
    }
    public void setHost(String host) {
        this.host = host;
    }

    public Integer getPort() {
        return port;
    }
    public void setPort(Integer port) {
        this.port = port;
    }

    public String getPath() {
        return path;
    }
    public void setPath(String path) {
        this.path = path;
    }

    public String getQueryString() {
        return queryString;
    }
    public void setQueryString(String queryString) {
        this.queryString = queryString;
    }

    public Integer getStatusCode() {
        return statusCode;
    }
    public void setStatusCode(Integer statusCode) {
        this.statusCode = statusCode;
    }

    public String getRequestHeaders() {
        return requestHeaders;
    }
    public void setRequestHeaders(String requestHeaders) {
        this.requestHeaders = requestHeaders;
    }

    public String getResponseHeaders() {
        return responseHeaders;
    }
    public void setResponseHeaders(String responseHeaders) {
        this.responseHeaders = responseHeaders;
    }

    public String getRequestBody() {
        return requestBody;
    }
    public void setRequestBody(String requestBody) {
        this.requestBody = requestBody;
    }

    public String getResponseBody() {
        return responseBody;
    }
    public void setResponseBody(String responseBody) {
        this.responseBody = responseBody;
    }

    public String getUserAgent() {
        return userAgent;
    }
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getContentType() {
        return contentType;
    }
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getContentLength() {
        return contentLength;
    }
    public void setContentLength(Long contentLength) {
        this.contentLength = contentLength;
    }

    public String getTlsVersion() {
        return tlsVersion;
    }
    public void setTlsVersion(String tlsVersion) {
        this.tlsVersion = tlsVersion;
    }

    public EventSource getEventSource() {
        return eventSource;
    }
    public void setEventSource(EventSource eventSource) {
        this.eventSource = eventSource;
    }
}
