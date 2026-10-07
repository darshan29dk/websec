package com.aegis.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "defense_validation_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefenseValidationPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID uuid;

    @Column(name = "recommendation_id", nullable = false)
    private UUID recommendationId;

    @Column(name = "plan_title", nullable = false)
    private String planTitle;

    @Column(name = "validation_steps_json", nullable = false, columnDefinition = "TEXT")
    private String validationStepsJson;

    @Column(name = "verification_boundary", columnDefinition = "TEXT")
    private String verificationBoundary;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

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
