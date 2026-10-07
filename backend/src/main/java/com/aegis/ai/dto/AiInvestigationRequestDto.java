package com.aegis.ai.dto;

public class AiInvestigationRequestDto {
    private Long assessmentId;
    private Long incidentId;

    public AiInvestigationRequestDto() {}

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public Long getIncidentId() { return incidentId; }
    public void setIncidentId(Long incidentId) { this.incidentId = incidentId; }
}
