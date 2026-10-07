package com.aegis.retest.entity;

import com.aegis.finding.entity.SecurityFinding;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "remediation_status_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemediationStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finding_id", nullable = false)
    private SecurityFinding finding;

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "new_status", nullable = false)
    private String newStatus;

    @Column(name = "changed_by", nullable = false)
    private String changedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private String source;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) uuid = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
