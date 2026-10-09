package com.globalshield.assessment.execution;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tool_executions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SecurityAssessment assessment;

    @Column(name = "tool_id")
    private UUID toolId;

    @Column(name = "tool_name", nullable = false)
    private String toolName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssessmentStage stage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ToolExecutionStatus status;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "exit_code")
    private Integer exitCode;

    @Column(name = "stdout_output", columnDefinition = "TEXT")
    private String stdoutOutput;

    @Column(name = "stderr_output", columnDefinition = "TEXT")
    private String stderrOutput;

    @Column(name = "stdout_reference")
    private String stdoutReference;

    @Column(name = "stderr_reference")
    private String stderrReference;

    @Column(name = "scope_reference")
    private String scopeReference;

    @Column(name = "authorization_reference")
    private String authorizationReference;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
