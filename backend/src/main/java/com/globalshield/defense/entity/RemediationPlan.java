package com.globalshield.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "remediation_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemediationPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID uuid;

    @Column(name = "finding_id")
    private UUID findingId;

    @Column(name = "recommendation_id")
    private UUID recommendationId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String priority = "MEDIUM";

    @Builder.Default
    @Column(nullable = false, length = 128)
    private String owner = "Unassigned";

    @Column(name = "target_date")
    private OffsetDateTime targetDate;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "OPEN"; // OPEN, IN_PROGRESS, BLOCKED, IMPLEMENTED, CANCELLED, VERIFICATION_PENDING, CLOSED

    @Builder.Default
    @Column(name = "remediation_mode", nullable = false, length = 32)
    private String remediationMode = "GUIDANCE_ONLY"; // GUIDANCE_ONLY, REVIEWABLE_ASSISTED_PATCH, CONTROLLED_AUTOMATED

    @Builder.Default
    @Column(name = "risk_level", nullable = false, length = 32)
    private String riskLevel = "LOW"; // LOW, MEDIUM, HIGH, CRITICAL

    @Builder.Default
    @Column(name = "approval_status", nullable = false, length = 32)
    private String approvalStatus = "NOT_REQUIRED"; // NOT_REQUIRED, PENDING_APPROVAL, APPROVED, REJECTED

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "reviewable_patch_diff", columnDefinition = "TEXT")
    private String reviewablePatchDiff;

    @Column(name = "verification_criteria", columnDefinition = "TEXT")
    private String verificationCriteria;

    @Column(name = "automated_action_type", length = 64)
    private String automatedActionType;

    @Builder.Default
    @Column(name = "is_automated_executable", nullable = false)
    private boolean automatedExecutable = false;

    @Column(name = "execution_log", columnDefinition = "TEXT")
    private String executionLog;

    @Column(name = "executed_at")
    private OffsetDateTime executedAt;

    @Column(name = "execution_status", length = 32)
    private String executionStatus;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
