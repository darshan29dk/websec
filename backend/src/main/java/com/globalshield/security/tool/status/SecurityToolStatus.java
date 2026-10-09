package com.globalshield.security.tool.status;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_tools_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityToolStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tool_name", nullable = false, unique = true)
    private String toolName;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "category")
    private String category; // RECONNAISSANCE, WEB_SECURITY, NETWORK_SECURITY, BLUE_TEAM_SIEM, DIGITAL_FORENSICS

    @Column(name = "integration_type")
    private String integrationType; // EXECUTABLE_SCANNER, EXTERNAL_API, MANAGED_SECURITY_PLATFORM, etc.

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "version")
    private String version;

    @Column(name = "executable_path")
    private String executablePath;

    @Column(name = "status", nullable = false)
    private String status; // AVAILABLE, NOT_AVAILABLE, NOT_CONFIGURED, DISABLED, FAILED

    @Column(name = "supported_operations", columnDefinition = "TEXT")
    private String supportedOperations;

    @Column(name = "configuration_status", columnDefinition = "TEXT")
    private String configurationStatus;

    @Column(name = "authorization_required", nullable = false)
    @Builder.Default
    private boolean authorizationRequired = true;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "last_checked_at")
    private OffsetDateTime lastCheckedAt;

    @Column(name = "created_at")
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
