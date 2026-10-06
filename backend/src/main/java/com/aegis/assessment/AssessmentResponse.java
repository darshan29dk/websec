package com.aegis.assessment;

import com.aegis.target.TargetResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResponse {
    private UUID id;
    private UUID targetId;
    private String targetName;
    private String targetPrimaryUrl;
    private TargetResponse target;
    private UUID profileId;
    private String profileName;
    private ProfileType profileType;
    private AssessmentStatus status;
    private boolean authorizationConfirmed;
    private UUID requestedById;
    private String requestedByName;
    private Instant startedAt;
    private Instant completedAt;
    private Instant createdAt;

    @Builder.Default
    private String statusMessage = "Assessment engine will be implemented in Phase 2.";

    public static AssessmentResponse fromEntity(SecurityAssessment assessment) {
        if (assessment == null) return null;
        return AssessmentResponse.builder()
                .id(assessment.getId())
                .targetId(assessment.getTarget() != null ? assessment.getTarget().getId() : null)
                .targetName(assessment.getTarget() != null ? assessment.getTarget().getName() : null)
                .targetPrimaryUrl(assessment.getTarget() != null ? assessment.getTarget().getPrimaryUrl() : null)
                .target(assessment.getTarget() != null ? TargetResponse.fromEntity(assessment.getTarget()) : null)
                .profileId(assessment.getProfile() != null ? assessment.getProfile().getId() : null)
                .profileName(assessment.getProfile() != null ? assessment.getProfile().getName() : null)
                .profileType(assessment.getProfile() != null ? assessment.getProfile().getProfileType() : null)
                .status(assessment.getStatus())
                .authorizationConfirmed(assessment.isAuthorizationConfirmed())
                .requestedById(assessment.getRequestedBy() != null ? assessment.getRequestedBy().getId() : null)
                .requestedByName(assessment.getRequestedBy() != null ? assessment.getRequestedBy().getDisplayName() : null)
                .startedAt(assessment.getStartedAt())
                .completedAt(assessment.getCompletedAt())
                .createdAt(assessment.getCreatedAt())
                .statusMessage("Assessment engine will be implemented in Phase 2.")
                .build();
    }
}
