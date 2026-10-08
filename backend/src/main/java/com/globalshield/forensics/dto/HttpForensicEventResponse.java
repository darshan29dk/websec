package com.globalshield.forensics.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class HttpForensicEventResponse {
    private UUID id;
    private UUID caseId;
    private UUID evidenceId;
    private Instant eventTime;
    private String sourceIp;
    private String destinationIp;
    private String method;
    private String scheme;
    private String host;
    private Integer port;
    private String path;
    private String queryString;
    private String httpVersion;
    private Integer statusCode;
    private String requestHeaders;
    private String responseHeaders;
    private String userAgent;
    private String referer;
    private String contentType;
    private Long contentLength;
    private String tlsVersion;
    private Instant createdAt;
}
