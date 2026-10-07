package com.aegis.retest.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "retest_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetestCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retest_id", nullable = false)
    private Retest retest;

    @Enumerated(EnumType.STRING)
    @Column(name = "check_type", nullable = false)
    private RetestCheckType checkType;

    @Column(name = "tool_name", nullable = false)
    private String toolName;

    @Column(name = "target_reference")
    private String targetReference;

    @Column(name = "endpoint_reference")
    private String endpointReference;

    @Column(name = "parameter_reference")
    private String parameterReference;

    @Column(name = "expected_condition", nullable = false, columnDefinition = "TEXT")
    private String expectedCondition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RetestCheckStatus status = RetestCheckStatus.QUEUED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) uuid = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
