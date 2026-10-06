package com.aegis.finding.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "finding_correlations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FindingCorrelation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finding_id", nullable = false)
    private SecurityFinding finding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_finding_id", nullable = false)
    private SecurityFinding relatedFinding;

    @Enumerated(EnumType.STRING)
    @Column(name = "correlation_type", nullable = false)
    private CorrelationType correlationType;

    @Column(nullable = false)
    @Builder.Default
    private String confidence = "HIGH";

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
