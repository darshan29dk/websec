package com.globalshield.forensics.entity;

import com.globalshield.forensics.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "forensic_evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForensicEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private ForensicCase forensicCase;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false, length = 64)
    private EvidenceType evidenceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 64)
    private EvidenceSourceType sourceType;

    @Column(name = "source_reference")
    private String sourceReference;

    @Column(name = "event_time")
    private Instant eventTime;

    @Column(name = "collection_time", nullable = false)
    private Instant collectionTime;

    @Column(name = "content_hash", nullable = false, length = 128)
    private String contentHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "integrity_status", nullable = false, length = 32)
    @Builder.Default
    private IntegrityStatus integrityStatus = IntegrityStatus.UNVERIFIED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private EvidenceConfidence confidence = EvidenceConfidence.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private EvidenceClassification classification = EvidenceClassification.OBSERVED;

    @Column(nullable = false)
    private String provenance;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
        }
        if (collectionTime == null) {
            collectionTime = Instant.now();
        }
    }
}
