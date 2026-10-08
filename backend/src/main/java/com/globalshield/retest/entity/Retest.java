package com.globalshield.retest.entity;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.target.SecurityTarget;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "retests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Retest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finding_id", nullable = false)
    private SecurityFinding finding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SecurityAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private SecurityTarget target;

    @Column(name = "requested_by", nullable = false)
    private String requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RetestStatus status = RetestStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "authorization_confirmed", nullable = false)
    private boolean authorizationConfirmed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) uuid = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
