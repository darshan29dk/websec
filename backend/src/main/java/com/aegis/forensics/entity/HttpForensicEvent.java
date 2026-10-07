package com.aegis.forensics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "http_forensic_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HttpForensicEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private ForensicCase forensicCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id")
    private ForensicEvidence evidence;

    @Column(name = "event_time", nullable = false)
    private Instant eventTime;

    @Column(name = "source_ip", length = 64)
    private String sourceIp;

    @Column(name = "destination_ip", length = 64)
    private String destinationIp;

    @Column(nullable = false, length = 16)
    private String method;

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String scheme = "http";

    @Column(nullable = false)
    private String host;

    @Column(nullable = false)
    @Builder.Default
    private Integer port = 80;

    @Column(nullable = false, length = 1024)
    private String path;

    @Column(name = "query_string", columnDefinition = "TEXT")
    private String queryString;

    @Column(name = "http_version", length = 32)
    private String httpVersion;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "request_headers", columnDefinition = "TEXT")
    private String requestHeaders;

    @Column(name = "response_headers", columnDefinition = "TEXT")
    private String responseHeaders;

    @Column(name = "request_body_reference")
    private String requestBodyReference;

    @Column(name = "response_body_reference")
    private String responseBodyReference;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(length = 512)
    private String referer;

    @Column(name = "content_type", length = 128)
    private String contentType;

    @Column(name = "content_length")
    private Long contentLength;

    @Column(name = "tls_version", length = 32)
    private String tlsVersion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
