package com.globalshield.posture.entity;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.target.SecurityTarget;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "security_posture_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityPostureSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private SecurityTarget target;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id")
    private SecurityAssessment assessment;

    @Column(name = "overall_score", nullable = false)
    private int overallScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private PostureRiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "score_status", nullable = false)
    private PostureStatus scoreStatus;

    @Column(name = "previous_score")
    private Integer previousScore;

    @Column(name = "score_delta")
    private Integer scoreDelta;

    @Column(name = "score_version", nullable = false, length = 20)
    @Builder.Default
    private String scoreVersion = "1.0";

    @Column(name = "calculated_at", nullable = false)
    private Instant calculatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "snapshot", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SecurityPostureDimension> dimensions = new ArrayList<>();

    @OneToMany(mappedBy = "snapshot", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostureScoreFactor> factors = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
        }
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (calculatedAt == null) calculatedAt = now;
    }
}
