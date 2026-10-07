package com.aegis.ai.dto;

import java.util.UUID;

public class AiInvestigationRequestDto {
    private UUID assessmentId;
    private UUID incidentId;

    public AiInvestigationRequestDto() {}

    public UUID getAssessmentId() { return assessmentId; }
    public void setAssessmentId(UUID assessmentId) { this.assessmentId = assessmentId; }

    public UUID getIncidentId() { return incidentId; }
    public void setIncidentId(UUID incidentId) { this.incidentId = incidentId; }
}
