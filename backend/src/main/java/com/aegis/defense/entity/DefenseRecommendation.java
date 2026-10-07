package com.aegis.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "defense_recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefenseRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID uuid;

    @Column(name = "finding_id")
    private UUID findingId;

    @Column(name = "investigation_id")
    private UUID investigationId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Builder.Default
    @Column(name = "root_cause", nullable = false, length = 64)
    private String rootCause = "UNKNOWN";

    @Column(name = "root_cause_explanation", columnDefinition = "TEXT")
    private String rootCauseExplanation;

    @Column(name = "recommendation_type", nullable = false, length = 64)
    private String recommendationType;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String priority = "MEDIUM"; // CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL

    @Column(name = "priority_reasons", columnDefinition = "TEXT")
    private String priorityReasons;

    @Builder.Default
    @Column(nullable = false)
    private Double confidence = 0.8;

    @Column(name = "confidence_basis", columnDefinition = "TEXT")
    private String confidenceBasis;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "PROPOSED"; // PROPOSED, UNDER_REVIEW, APPROVED, REJECTED, IMPLEMENTED, VERIFIED, SUPERSEDED

    @Column(name = "implementation_guidance", columnDefinition = "TEXT")
    private String implementationGuidance;

    @Column(name = "compensating_controls", columnDefinition = "TEXT")
    private String compensatingControls;

    @Column(name = "implementation_risks", columnDefinition = "TEXT")
    private String implementationRisks;

    @Builder.Default
    @Column(name = "created_by", nullable = false)
    private String createdBy = "system";

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
