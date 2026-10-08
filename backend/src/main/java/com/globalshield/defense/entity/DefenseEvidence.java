package com.globalshield.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "defense_evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefenseEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID uuid;

    @Column(name = "recommendation_id", nullable = false)
    private UUID recommendationId;

    @Column(name = "evidence_type", nullable = false, length = 64)
    private String evidenceType; // FINDING, HTTP_EVENT, NETWORK_EVENT, FORENSIC_ARTIFACT, INVESTIGATION_RESULT, CONFIGURATION, TOOL_RESULT, MANUAL_REVIEW

    @Column(name = "source_type", nullable = false, length = 64)
    private String sourceType;

    @Column(name = "source_id")
    private String sourceId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Double confidence = 1.0;

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
