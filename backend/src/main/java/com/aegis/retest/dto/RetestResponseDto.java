package com.aegis.retest.dto;

import com.aegis.retest.entity.Retest;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class RetestResponseDto {
    private String id;
    private String uuid;
    private String findingId;
    private String findingTitle;
    private String assessmentId;
    private String targetId;
    private String targetName;
    private String targetUrl;
    private String requestedBy;
    private String status;
    private String reason;
    private boolean authorizationConfirmed;
    private OffsetDateTime createdAt;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private List<RetestCheckDto> checks;
    private DefenseValidationDto validation;

    public static RetestResponseDto fromEntity(Retest retest, List<RetestCheckDto> checks, DefenseValidationDto validation) {
        if (retest == null) return null;
        return RetestResponseDto.builder()
                .id(retest.getId() != null ? retest.getId().toString() : null)
                .uuid(retest.getUuid())
                .findingId(retest.getFinding() != null && retest.getFinding().getId() != null ? retest.getFinding().getId().toString() : null)
                .findingTitle(retest.getFinding() != null ? retest.getFinding().getTitle() : null)
                .assessmentId(retest.getAssessment() != null && retest.getAssessment().getId() != null ? retest.getAssessment().getId().toString() : null)
                .targetId(retest.getTarget() != null && retest.getTarget().getId() != null ? retest.getTarget().getId().toString() : null)
                .targetName(retest.getTarget() != null ? retest.getTarget().getName() : null)
                .targetUrl(retest.getTarget() != null ? retest.getTarget().getPrimaryUrl() : null)
                .requestedBy(retest.getRequestedBy())
                .status(retest.getStatus() != null ? retest.getStatus().name() : null)
                .reason(retest.getReason())
                .authorizationConfirmed(retest.isAuthorizationConfirmed())
                .createdAt(retest.getCreatedAt())
                .startedAt(retest.getStartedAt())
                .completedAt(retest.getCompletedAt())
                .checks(checks)
                .validation(validation)
                .build();
    }
}
