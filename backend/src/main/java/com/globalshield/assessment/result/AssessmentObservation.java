package com.globalshield.assessment.result;

import com.globalshield.assessment.SecurityAssessment;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assessment_observations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SecurityAssessment assessment;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ObservationSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ObservationConfidence confidence;

    @Column(nullable = false)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
