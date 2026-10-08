package com.globalshield.forensics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence_provenance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceProvenance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private ForensicEvidence evidence;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String collector;

    @Column(name = "collected_at", nullable = false)
    private Instant collectedAt;

    @Column(name = "original_reference")
    private String originalReference;

    @Column(nullable = false, length = 128)
    private String sha256;

    @Column(columnDefinition = "TEXT")
    private String transformation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
