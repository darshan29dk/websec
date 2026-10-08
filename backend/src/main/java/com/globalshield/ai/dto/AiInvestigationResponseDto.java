package com.globalshield.ai.dto;

import com.globalshield.ai.entity.AiAnalysisClaim;
import com.globalshield.ai.entity.AiEvidenceReference;
import com.globalshield.ai.entity.AiInvestigation;
import com.globalshield.ai.entity.AiKnowledgeReference;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AiInvestigationResponseDto {
    private Long id;
    private UUID uuid;
    private UUID assessmentId;
    private UUID incidentId;
    private String requestedBy;
    private String status;
    private String provider;
    private String model;
    private String promptVersion;
    private Double confidence;
    private String confidenceBasis;
    private String verdict;
    private String summary;
    private String whatHappened;
    private String timelineSummary;
    private String affectedTargetSummary;
    private String affectedEndpointsSummary;
    private String rootCause;
    private String impact;
    private String supportingEvidenceSummary;
    private String contradictingEvidenceSummary;
    private String missingEvidenceSummary;
    private String recommendedNextSteps;
    private String limitations;
    private String failureReason;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime createdAt;

    private List<AiAnalysisClaim> claims = new ArrayList<>();
    private List<AiEvidenceReference> evidenceReferences = new ArrayList<>();
    private List<AiKnowledgeReference> knowledgeReferences = new ArrayList<>();

    public AiInvestigationResponseDto() {}

    public static AiInvestigationResponseDto fromEntity(AiInvestigation inv,
                                                        List<AiAnalysisClaim> claims,
                                                        List<AiEvidenceReference> evidenceRefs,
                                                        List<AiKnowledgeReference> knowledgeRefs) {
        AiInvestigationResponseDto dto = new AiInvestigationResponseDto();
        dto.id = inv.getId();
        dto.uuid = inv.getUuid();
        dto.assessmentId = inv.getAssessmentId();
        dto.incidentId = inv.getIncidentId();
        dto.requestedBy = inv.getRequestedBy();
        dto.status = inv.getStatus();
        dto.provider = inv.getProvider();
        dto.model = inv.getModel();
        dto.promptVersion = inv.getPromptVersion();
        dto.confidence = inv.getConfidence();
        dto.confidenceBasis = inv.getConfidenceBasis();
        dto.verdict = inv.getVerdict();
        dto.summary = inv.getSummary();
        dto.whatHappened = inv.getWhatHappened();
        dto.timelineSummary = inv.getTimelineSummary();
        dto.affectedTargetSummary = inv.getAffectedTargetSummary();
        dto.affectedEndpointsSummary = inv.getAffectedEndpointsSummary();
        dto.rootCause = inv.getRootCause();
        dto.impact = inv.getImpact();
        dto.supportingEvidenceSummary = inv.getSupportingEvidenceSummary();
        dto.contradictingEvidenceSummary = inv.getContradictingEvidenceSummary();
        dto.missingEvidenceSummary = inv.getMissingEvidenceSummary();
        dto.recommendedNextSteps = inv.getRecommendedNextSteps();
        dto.limitations = inv.getLimitations();
        dto.failureReason = inv.getFailureReason();
        dto.startedAt = inv.getStartedAt();
        dto.completedAt = inv.getCompletedAt();
        dto.createdAt = inv.getCreatedAt();
        if (claims != null) dto.claims = claims;
        if (evidenceRefs != null) dto.evidenceReferences = evidenceRefs;
        if (knowledgeRefs != null) dto.knowledgeReferences = knowledgeRefs;
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getUuid() { return uuid; }
    public void setUuid(UUID uuid) { this.uuid = uuid; }

    public UUID getAssessmentId() { return assessmentId; }
    public void setAssessmentId(UUID assessmentId) { this.assessmentId = assessmentId; }

    public UUID getIncidentId() { return incidentId; }
    public void setIncidentId(UUID incidentId) { this.incidentId = incidentId; }

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

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public List<AiAnalysisClaim> getClaims() { return claims; }
    public void setClaims(List<AiAnalysisClaim> claims) { this.claims = claims; }

    public List<AiEvidenceReference> getEvidenceReferences() { return evidenceReferences; }
    public void setEvidenceReferences(List<AiEvidenceReference> evidenceReferences) { this.evidenceReferences = evidenceReferences; }

    public List<AiKnowledgeReference> getKnowledgeReferences() { return knowledgeReferences; }
    public void setKnowledgeReferences(List<AiKnowledgeReference> knowledgeReferences) { this.knowledgeReferences = knowledgeReferences; }
}
