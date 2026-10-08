package com.aegis.posture.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "security_posture_dimensions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityPostureDimension {

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

    @Column
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostureStatus status;

    @Column(name = "evidence_count", nullable = false)
    @Builder.Default
    private int evidenceCount = 0;

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
