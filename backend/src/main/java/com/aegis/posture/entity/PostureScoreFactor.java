package com.aegis.posture.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "posture_score_factors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostureScoreFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private SecurityPostureSnapshot snapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostureDimensionType dimension;

    @Column(name = "factor_type", nullable = false, length = 100)
    private String factorType;

    @Column(name = "factor_name", nullable = false)
    private String factorName;

    @Column(nullable = false)
    private int impact; // e.g. -12 or +7

    @Column(nullable = false)
    @Builder.Default
    private double weight = 1.0;

    @Column(name = "evidence_reference")
    private String evidenceReference;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
