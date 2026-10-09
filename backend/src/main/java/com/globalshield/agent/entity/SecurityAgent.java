package com.globalshield.agent.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "security_agents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAgent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "agent_key_hash", nullable = false, unique = true, length = 128)
    private String agentKeyHash;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(length = 255)
    private String hostname;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "REGISTERED"; // REGISTERED, ONLINE, BUSY, OFFLINE, REVOKED

    @Column(nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String capabilities = "[]"; // JSON array of tool names

    @Column(name = "operating_system", length = 64)
    private String operatingSystem;

    @Column(name = "agent_version", nullable = false, length = 32)
    @Builder.Default
    private String agentVersion = "1.0.0";

    @Column(name = "last_heartbeat_at")
    private Instant lastHeartbeatAt;

    @Column(name = "registered_at", nullable = false)
    private Instant registeredAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean revoked = false;

    @Column(name = "revocation_reason", columnDefinition = "TEXT")
    private String revocationReason;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (registeredAt == null) registeredAt = now;
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
