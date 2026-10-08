package com.globalshield.assessment.dto;

import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.assessment.result.ObservationConfidence;
import com.globalshield.assessment.result.ObservationSeverity;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ObservationResponse {
    private UUID id;
    private UUID assessmentId;
    private String category;
    private String title;
    private String description;
    private ObservationSeverity severity;
    private ObservationConfidence confidence;
    private String source;
    private String evidence;
    private Instant createdAt;

    public static ObservationResponse fromEntity(AssessmentObservation obs) {
        return ObservationResponse.builder()
                .id(obs.getId())
                .assessmentId(obs.getAssessment() != null ? obs.getAssessment().getId() : null)
                .category(obs.getCategory())
                .title(obs.getTitle())
                .description(obs.getDescription())
                .severity(obs.getSeverity())
                .confidence(obs.getConfidence())
                .source(obs.getSource())
                .evidence(obs.getEvidence())
                .createdAt(obs.getCreatedAt())
                .build();
    }
}
