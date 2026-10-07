package com.aegis.ai.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_investigations")
public class AiInvestigation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private UUID uuid = UUID.randomUUID();

    @Column(name = "assessment_id")
    private Long assessmentId;

    @Column(name = "incident_id")
    private Long incidentId;

    @Column(name = "requested_by", nullable = false)
    private String requestedBy;

    @Column(nullable = false)
    private String status = "QUEUED"; // QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String model;

    @Column(name = "prompt_version")
    private String promptVersion = "1.0";

    private Double confidence;

    @Column(name = "confidence_basis", columnDefinition = "TEXT")
    private String confidenceBasis;

    private String verdict;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "what_happened", columnDefinition = "TEXT")
    private String whatHappened;

    @Column(name = "timeline_summary", columnDefinition = "TEXT")
    private String timelineSummary;

    @Column(name = "affected_target_summary", columnDefinition = "TEXT")
    private String affectedTargetSummary;

    @Column(name = "affected_endpoints_summary", columnDefinition = "TEXT")
    private String affectedEndpointsSummary;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(columnDefinition = "TEXT")
    private String impact;

    @Column(name = "supporting_evidence_summary", columnDefinition = "TEXT")
    private String supportingEvidenceSummary;

    @Column(name = "contradicting_evidence_summary", columnDefinition = "TEXT")
    private String contradictingEvidenceSummary;

    @Column(name = "missing_evidence_summary", columnDefinition = "TEXT")
    private String missingEvidenceSummary;

    @Column(name = "recommended_next_steps", columnDefinition = "TEXT")
    private String recommendedNextSteps;

    @Column(columnDefinition = "TEXT")
    private String limitations;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public AiInvestigation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getUuid() { return uuid; }
    public void setUuid(UUID uuid) { this.uuid = uuid; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public Long getIncidentId() { return incidentId; }
    public void setIncidentId(Long incidentId) { this.incidentId = incidentId; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getPromptVersion() { return promptVersion; }
    public void setPromptVersion(String promptVersion) { this.promptVersion = promptVersion; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getConfidenceBasis() { return confidenceBasis; }
    public void setConfidenceBasis(String confidenceBasis) { this.confidenceBasis = confidenceBasis; }

    public String getVerdict() { return verdict; }
    public void setVerdict(String verdict) { this.verdict = verdict; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getWhatHappened() { return whatHappened; }
    public void setWhatHappened(String whatHappened) { this.whatHappened = whatHappened; }

    public String getTimelineSummary() { return timelineSummary; }
    public void setTimelineSummary(String timelineSummary) { this.timelineSummary = timelineSummary; }

    public String getAffectedTargetSummary() { return affectedTargetSummary; }
    public void setAffectedTargetSummary(String affectedTargetSummary) { this.affectedTargetSummary = affectedTargetSummary; }

    public String getAffectedEndpointsSummary() { return affectedEndpointsSummary; }
    public void setAffectedEndpointsSummary(String affectedEndpointsSummary) { this.affectedEndpointsSummary = affectedEndpointsSummary; }

    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }

    public String getImpact() { return impact; }
    public void setImpact(String impact) { this.impact = impact; }

    public String getSupportingEvidenceSummary() { return supportingEvidenceSummary; }
    public void setSupportingEvidenceSummary(String supportingEvidenceSummary) { this.supportingEvidenceSummary = supportingEvidenceSummary; }

    public String getContradictingEvidenceSummary() { return contradictingEvidenceSummary; }
    public void setContradictingEvidenceSummary(String contradictingEvidenceSummary) { this.contradictingEvidenceSummary = contradictingEvidenceSummary; }

    public String getMissingEvidenceSummary() { return missingEvidenceSummary; }
    public void setMissingEvidenceSummary(String missingEvidenceSummary) { this.missingEvidenceSummary = missingEvidenceSummary; }

    public String getRecommendedNextSteps() { return recommendedNextSteps; }
    public void setRecommendedNextSteps(String recommendedNextSteps) { this.recommendedNextSteps = recommendedNextSteps; }

    public String getLimitations() { return limitations; }
    public void setLimitations(String limitations) { this.limitations = limitations; }

    public String getRawResponse() { return rawResponse; }
    public void setRawResponse(String rawResponse) { this.rawResponse = rawResponse; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
