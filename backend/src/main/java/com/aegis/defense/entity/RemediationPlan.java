package com.aegis.defense.entity;

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
