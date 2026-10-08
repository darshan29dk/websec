package com.globalshield.assessment.dto;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessment;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AssessmentStatusResponse {
    private UUID id;
    private AssessmentStatus status;
    private AssessmentStage currentStage;
    private Integer progressPercent;
    private Instant queuedAt;
    private Instant validationStartedAt;
    private Instant startedAt;
    private Instant completedAt;

    public static AssessmentStatusResponse fromEntity(SecurityAssessment assessment) {
        return AssessmentStatusResponse.builder()
                .id(assessment.getId())
                .status(assessment.getStatus())
                .currentStage(assessment.getCurrentStage())
                .progressPercent(assessment.getProgressPercent())
                .queuedAt(assessment.getQueuedAt())
                .validationStartedAt(assessment.getValidationStartedAt())
                .startedAt(assessment.getStartedAt())
                .completedAt(assessment.getCompletedAt())
                .build();
    }
}
