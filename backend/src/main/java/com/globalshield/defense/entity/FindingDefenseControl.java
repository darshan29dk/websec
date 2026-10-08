package com.globalshield.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "finding_defense_controls")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FindingDefenseControl {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "finding_id", nullable = false)
    private UUID findingId;

    @Column(name = "control_id", nullable = false)
    private UUID controlId;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String relationship = "PRIMARY"; // PRIMARY, SECONDARY, COMPENSATING

    @Builder.Default
    private Double confidence = 0.9;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
