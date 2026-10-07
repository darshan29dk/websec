package com.aegis.retest.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "retest_evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetestEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retest_id", nullable = false)
    private Retest retest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_id")
    private RetestCheck check;

    @Column(nullable = false)
    private String source;

    @Column(name = "evidence_type", nullable = false)
    private String evidenceType;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "evidence_data", nullable = false, columnDefinition = "TEXT")
    private String evidenceData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) uuid = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
