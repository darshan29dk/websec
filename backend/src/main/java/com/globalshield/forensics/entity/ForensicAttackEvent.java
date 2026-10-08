package com.globalshield.forensics.entity;

import com.globalshield.forensics.enums.AttackStage;
import com.globalshield.forensics.enums.EvidenceClassification;
import com.globalshield.forensics.enums.EvidenceConfidence;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "forensic_attack_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForensicAttackEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private ForensicCase forensicCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timeline_event_id")
    private ForensicTimelineEvent timelineEvent;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private AttackStage stage;

    @Column(name = "event_time")
    private Instant eventTime;

    @Column(name = "source_ip", length = 64)
    private String sourceIp;

    @Column(name = "target_endpoint", length = 512)
    private String targetEndpoint;

    @Column(name = "http_method", length = 16)
    private String httpMethod;

    @Column(name = "status_code")
    private Integer statusCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id")
    private ForensicEvidence evidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private EvidenceConfidence confidence = EvidenceConfidence.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private EvidenceClassification classification = EvidenceClassification.OBSERVED;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
