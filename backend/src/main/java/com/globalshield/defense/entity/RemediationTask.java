package com.globalshield.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "remediation_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemediationTask {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID uuid;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "task_type", nullable = false, length = 64)
    private String taskType; // CODE, CONFIGURATION, INFRASTRUCTURE, PATCH, DOCUMENTATION, MONITORING, TESTING, OTHER

    @Builder.Default
    @Column(nullable = false)
    private Integer sequence = 1;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "OPEN"; // OPEN, IN_PROGRESS, COMPLETED, CANCELLED

    @Builder.Default
    @Column(nullable = false, length = 128)
    private String owner = "Unassigned";

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
