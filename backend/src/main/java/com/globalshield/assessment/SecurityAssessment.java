package com.globalshield.assessment;

import com.globalshield.target.SecurityTarget;
import com.globalshield.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "security_assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private SecurityTarget target;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private AssessmentProfile profile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AssessmentStatus status = AssessmentStatus.QUEUED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Column(name = "authorization_confirmed", nullable = false)
    private boolean authorizationConfirmed;

    @Column(name = "progress_percent", nullable = false)
    @Builder.Default
    private int progressPercent = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage")
    private AssessmentStage currentStage;

    @Column(name = "queued_at")
    private Instant queuedAt;

    @Column(name = "validation_started_at")
    private Instant validationStartedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (queuedAt == null) {
            queuedAt = createdAt;
        }
    }
}
