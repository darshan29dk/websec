package com.aegis.forensics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application_forensic_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationForensicEvent {

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

    @Column(nullable = false, length = 128)
    private String application;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String severity = "INFO";

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "request_id", length = 128)
    private String requestId;

    @Column(name = "session_id", length = 128)
    private String sessionId;

    @Column(name = "user_id_reference", length = 128)
    private String userIdReference;

    @Column(name = "source_ip", length = 64)
    private String sourceIp;

    @Column(length = 512)
    private String endpoint;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
