package com.aegis.forensics.entity;

import com.aegis.forensics.enums.EvidenceConfidence;
import com.aegis.forensics.enums.TimelineEventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "forensic_timeline_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForensicTimelineEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private ForensicCase forensicCase;

    @Column(name = "event_time")
    private Instant eventTime;

    @Column(name = "time_description")
    private String timeDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 64)
    private TimelineEventType eventType;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String severity = "INFO";

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id")
    private ForensicEvidence evidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private EvidenceConfidence confidence = EvidenceConfidence.MEDIUM;

    @Column(name = "sequence_number", nullable = false)
    @Builder.Default
    private Integer sequenceNumber = 1;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
