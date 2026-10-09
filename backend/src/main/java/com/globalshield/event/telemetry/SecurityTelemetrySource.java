package com.globalshield.event.telemetry;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_telemetry_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityTelemetrySource {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType; // SIEM_CONNECTOR, IDS_ENGINE, PACKET_ANALYSIS, TELEMETRY_SOURCE

    @Column(name = "endpoint_url", length = 512)
    private String endpointUrl;

    @Column(name = "connection_status", length = 50)
    @Builder.Default
    private String connectionStatus = "NOT_CONFIGURED"; // CONNECTED, DISCONNECTED, NOT_CONFIGURED, ERROR

    @Column(name = "tenant_identifier", length = 255)
    private String tenantIdentifier;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "last_ingested_at")
    private OffsetDateTime lastIngestedAt;

    @Column(name = "last_sync_at")
    private OffsetDateTime lastSyncAt;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
