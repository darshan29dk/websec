package com.aegis.retest.entity;

import com.aegis.finding.entity.SecurityFinding;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "defense_validations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefenseValidation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finding_id", nullable = false)
    private SecurityFinding finding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retest_id", nullable = false)
    private Retest retest;

    @Enumerated(EnumType.STRING)
    @Column(name = "validation_status", nullable = false)
    private ValidationStatus validationStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ValidationConfidence confidence;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "validated_by", nullable = false)
    private String validatedBy;

    @Column(name = "validated_at", nullable = false)
    private OffsetDateTime validatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) uuid = UUID.randomUUID().toString();
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (validatedAt == null) validatedAt = now;
    }
}
