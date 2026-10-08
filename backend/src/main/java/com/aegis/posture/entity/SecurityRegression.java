package com.aegis.posture.entity;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.finding.entity.SecurityFinding;
import com.aegis.target.SecurityTarget;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "security_regressions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityRegression {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private SecurityTarget target;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_assessment_id")
    private SecurityAssessment previousAssessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_assessment_id")
    private SecurityAssessment currentAssessment;

    @Column(name = "finding_fingerprint", nullable = false, length = 64)
    private String findingFingerprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_finding_id")
    private SecurityFinding previousFinding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_finding_id")
    private SecurityFinding currentFinding;

    @Enumerated(EnumType.STRING)
    @Column(name = "regression_type", nullable = false)
    private RegressionType regressionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegressionConfidence confidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegressionStatus status;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
        }
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (detectedAt == null) detectedAt = now;
    }
}
