package com.globalshield.finding.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "finding_evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FindingEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finding_id", nullable = false)
    private SecurityFinding finding;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false)
    private EvidenceType evidenceType;

    @Column(nullable = false)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "redacted_content", columnDefinition = "TEXT")
    private String redactedContent;

    @Column(columnDefinition = "TEXT")
    private String location;

    @Column(name = "observed_at", nullable = false)
    private Instant observedAt;

    @Column(length = 64)
    private String hash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
        }
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (observedAt == null) observedAt = now;
    }
}
