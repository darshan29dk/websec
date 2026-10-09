package com.globalshield.fuzzing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fuzzing_multi_step_sequences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingMultiStepSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private FuzzingCampaign campaign;

    @Column(name = "sequence_name", nullable = false)
    private String sequenceName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_steps", nullable = false)
    @Builder.Default
    private Integer totalSteps = 1;

    @Column(name = "current_step", nullable = false)
    @Builder.Default
    private Integer currentStep = 0;

    @Column(name = "session_state_json", columnDefinition = "TEXT")
    private String sessionStateJson;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "halt_reason")
    private String haltReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
