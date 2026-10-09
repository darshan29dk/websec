package com.globalshield.fuzzing.entity;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.target.SecurityTarget;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fuzzing_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private SecurityTarget target;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id")
    private SecurityAssessment assessment;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private FuzzingProfile profile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private FuzzingStatus status = FuzzingStatus.PENDING;

    @Column(name = "target_scope_snapshot", length = 1024)
    private String targetScopeSnapshot;

    @Column(name = "rate_limit_rps", nullable = false)
    @Builder.Default
    private Integer rateLimitRps = 5;

    @Column(name = "max_requests", nullable = false)
    @Builder.Default
    private Integer maxRequests = 100;

    @Column(name = "timeout_ms", nullable = false)
    @Builder.Default
    private Integer timeoutMs = 10000;

    @Column(name = "concurrency", nullable = false)
    @Builder.Default
    private Integer concurrency = 1;

    @Column(name = "categories", length = 512)
    private String categories;

    @Column(name = "custom_headers", columnDefinition = "TEXT")
    private String customHeaders;

    @Column(name = "total_test_cases", nullable = false)
    @Builder.Default
    private Integer totalTestCases = 0;

    @Column(name = "executed_test_cases", nullable = false)
    @Builder.Default
    private Integer executedTestCases = 0;

    @Column(name = "findings_count", nullable = false)
    @Builder.Default
    private Integer findingsCount = 0;

    @Column(name = "suspicious_count", nullable = false)
    @Builder.Default
    private Integer suspiciousCount = 0;

    @Column(name = "duration_ms")
    @Builder.Default
    private Long durationMs = 0L;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
