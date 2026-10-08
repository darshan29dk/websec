package com.globalshield.ai.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ai_evidence_references")
public class AiEvidenceReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "investigation_id", nullable = false)
    private Long investigationId;

    @Column(name = "claim_id")
    private Long claimId;

    @Column(name = "evidence_type", nullable = false)
    private String evidenceType; // FINDING, HTTP_EVENT, FORENSIC_ARTIFACT, ATTACK_EVENT, TIMELINE_EVENT

    @Column(name = "evidence_id", nullable = false)
    private String evidenceId; // F-102, H-331, etc.

    @Column(nullable = false)
    private String relationship; // SUPPORTS, CONTRADICTS, CONTEXT

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public AiEvidenceReference() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getInvestigationId() { return investigationId; }
    public void setInvestigationId(Long investigationId) { this.investigationId = investigationId; }

    public Long getClaimId() { return claimId; }
    public void setClaimId(Long claimId) { this.claimId = claimId; }

    public String getEvidenceType() { return evidenceType; }
    public void setEvidenceType(String evidenceType) { this.evidenceType = evidenceType; }

    public String getEvidenceId() { return evidenceId; }
    public void setEvidenceId(String evidenceId) { this.evidenceId = evidenceId; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
