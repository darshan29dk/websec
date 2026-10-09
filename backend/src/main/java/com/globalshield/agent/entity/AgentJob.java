package com.globalshield.agent.entity;

import com.globalshield.target.SecurityTarget;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentJob {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private SecurityAgent agent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id")
    private SecurityTarget target;

    @Column(name = "tool_name", nullable = false, length = 64)
    private String toolName;

    @Column(nullable = false, length = 128)
    private String operation;

    @Column(name = "parameters_json", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String parametersJson = "{}";

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "QUEUED"; // QUEUED, DISPATCHED, RUNNING, COMPLETED, FAILED, CANCELLED, TIMEOUT

    @Column(name = "timeout_seconds", nullable = false)
    @Builder.Default
    private Integer timeoutSeconds = 300;

    @Column(name = "scope_verified", nullable = false)
    @Builder.Default
    private boolean scopeVerified = true;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "exit_code")
    private Integer exitCode;

    @Column(name = "stdout_sanitized", columnDefinition = "TEXT")
    private String stdoutSanitized;

    @Column(name = "stderr_sanitized", columnDefinition = "TEXT")
    private String stderrSanitized;

    @Column(name = "evidence_reference", length = 512)
    private String evidenceReference;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
