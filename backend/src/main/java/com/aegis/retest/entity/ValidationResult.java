package com.aegis.retest.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "validation_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validation_id", nullable = false)
    private DefenseValidation validation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_id", nullable = false)
    private RetestCheck check;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_type", nullable = false)
    private ValidationResultType resultType;

    @Column(name = "expected_value", columnDefinition = "TEXT")
    private String expectedValue;

    @Column(name = "observed_value", columnDefinition = "TEXT")
    private String observedValue;

    @Column(name = "comparison_result", columnDefinition = "TEXT")
    private String comparisonResult;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ValidationConfidence confidence;

    @Column(name = "evidence_reference")
    private String evidenceReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) uuid = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
