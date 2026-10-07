package com.aegis.event;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "http_events")
public class HttpEvent {

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

    @Column(nullable = false, length = 10)
    private String method;

    @Column(nullable = false, length = 10)
    private String scheme;

    @Column(nullable = false, length = 255)
    private String host;

    @Column(nullable = false)
    private Integer port;

    @Column(nullable = false, length = 1024)
    private String path;

    @Column(name = "query_string", columnDefinition = "TEXT")
    private String queryString;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "request_headers", columnDefinition = "TEXT")
    private String requestHeaders;

    @Column(name = "response_headers", columnDefinition = "TEXT")
    private String responseHeaders;

    @Column(name = "request_body_reference", columnDefinition = "TEXT")
    private String requestBodyReference;

    @Column(name = "response_body_reference", columnDefinition = "TEXT")
    private String responseBodyReference;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "content_type", length = 255)
    private String contentType;

    @Column(name = "content_length")
    private Long contentLength;

    @Column(name = "tls_version", length = 20)
    private String tlsVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public HttpEvent() {
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

    public String getRequestBodyReference() {
        return requestBodyReference;
    }
    public void setRequestBodyReference(String requestBodyReference) {
        this.requestBodyReference = requestBodyReference;
    }

    public String getResponseBodyReference() {
        return responseBodyReference;
    }
    public void setResponseBodyReference(String responseBodyReference) {
        this.responseBodyReference = responseBodyReference;
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
