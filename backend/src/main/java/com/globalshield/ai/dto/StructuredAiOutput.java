package com.globalshield.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class StructuredAiOutput {

    private String verdict = "INSUFFICIENT_EVIDENCE";
    private double confidence = 0.5;

    @JsonProperty("confidence_basis")
    private String confidenceBasis = "Based on available AEGIS telemetry.";

    private String summary = "";

    @JsonProperty("what_happened")
    private String whatHappened = "";

    private List<String> timeline = new ArrayList<>();

    @JsonProperty("affected_target")
    private String affectedTarget = "";

    @JsonProperty("affected_endpoints")
    private List<String> affectedEndpoints = new ArrayList<>();

    @JsonProperty("observed_facts")
    private List<String> observedFacts = new ArrayList<>();

    private List<String> inferences = new ArrayList<>();
    private List<String> hypotheses = new ArrayList<>();

    @JsonProperty("root_cause")
    private String rootCause = "";

    private String impact = "";

    @JsonProperty("supporting_evidence")
    private List<String> supportingEvidence = new ArrayList<>();

    @JsonProperty("contradicting_evidence")
    private List<String> contradictingEvidence = new ArrayList<>();

    @JsonProperty("missing_evidence")
    private List<String> missingEvidence = new ArrayList<>();

    @JsonProperty("knowledge_references")
    private List<String> knowledgeReferences = new ArrayList<>();

    @JsonProperty("recommended_next_steps")
    private List<String> recommendedNextSteps = new ArrayList<>();

    private List<String> limitations = new ArrayList<>();

    public StructuredAiOutput() {}

    public String getVerdict() { return verdict; }
    public void setVerdict(String verdict) { this.verdict = verdict; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public String getConfidenceBasis() { return confidenceBasis; }
    public void setConfidenceBasis(String confidenceBasis) { this.confidenceBasis = confidenceBasis; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getWhatHappened() { return whatHappened; }
    public void setWhatHappened(String whatHappened) { this.whatHappened = whatHappened; }

    public List<String> getTimeline() { return timeline; }
    public void setTimeline(List<String> timeline) { this.timeline = timeline; }

    public String getAffectedTarget() { return affectedTarget; }
    public void setAffectedTarget(String affectedTarget) { this.affectedTarget = affectedTarget; }

    public List<String> getAffectedEndpoints() { return affectedEndpoints; }
    public void setAffectedEndpoints(List<String> affectedEndpoints) { this.affectedEndpoints = affectedEndpoints; }

    public List<String> getObservedFacts() { return observedFacts; }
    public void setObservedFacts(List<String> observedFacts) { this.observedFacts = observedFacts; }

    public List<String> getInferences() { return inferences; }
    public void setInferences(List<String> inferences) { this.inferences = inferences; }

    public List<String> getHypotheses() { return hypotheses; }
    public void setHypotheses(List<String> hypotheses) { this.hypotheses = hypotheses; }

    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }

    public String getImpact() { return impact; }
    public void setImpact(String impact) { this.impact = impact; }

    public List<String> getSupportingEvidence() { return supportingEvidence; }
    public void setSupportingEvidence(List<String> supportingEvidence) { this.supportingEvidence = supportingEvidence; }

    public List<String> getContradictingEvidence() { return contradictingEvidence; }
    public void setContradictingEvidence(List<String> contradictingEvidence) { this.contradictingEvidence = contradictingEvidence; }

    public List<String> getMissingEvidence() { return missingEvidence; }
    public void setMissingEvidence(List<String> missingEvidence) { this.missingEvidence = missingEvidence; }

    public List<String> getKnowledgeReferences() { return knowledgeReferences; }
    public void setKnowledgeReferences(List<String> knowledgeReferences) { this.knowledgeReferences = knowledgeReferences; }

    public List<String> getRecommendedNextSteps() { return recommendedNextSteps; }
    public void setRecommendedNextSteps(List<String> recommendedNextSteps) { this.recommendedNextSteps = recommendedNextSteps; }

    public List<String> getLimitations() { return limitations; }
    public void setLimitations(List<String> limitations) { this.limitations = limitations; }
}
