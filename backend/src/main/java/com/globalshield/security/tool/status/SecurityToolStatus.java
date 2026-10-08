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

    @Column(name = "version")
    private String version;

    @Column(name = "executable_path")
    private String executablePath;

    @Column(name = "status", nullable = false)
    private String status; // AVAILABLE, NOT_AVAILABLE, NOT_CONFIGURED, FAILED

    @Column(name = "supported_operations", columnDefinition = "TEXT")
    private String supportedOperations;

    @Column(name = "configuration_status", columnDefinition = "TEXT")
    private String configurationStatus;

    @Column(name = "last_checked_at")
    private OffsetDateTime lastCheckedAt;
}
