package com.globalshield.fuzzing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fuzzing_coverage_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingCoverageResult {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private FuzzingCampaign campaign;

    @Column(name = "owasp_category", nullable = false, length = 10)
    private String owaspCategory;

    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @Column(name = "supported_checks_count", nullable = false)
    @Builder.Default
    private Integer supportedChecksCount = 0;

    @Column(name = "executed_checks_count", nullable = false)
    @Builder.Default
    private Integer executedChecksCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CoverageStatus status;

    @Column(name = "limitations_notes", columnDefinition = "TEXT")
    private String limitationsNotes;

    @Column(name = "tested_at", nullable = false)
    private Instant testedAt;

    @PrePersist
    protected void onCreate() {
        if (testedAt == null) {
            testedAt = Instant.now();
        }
    }
}
