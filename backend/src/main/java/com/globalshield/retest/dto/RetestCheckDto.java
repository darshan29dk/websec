package com.globalshield.retest.dto;

import com.globalshield.retest.entity.RetestCheck;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class RetestCheckDto {
    private String id;
    private String uuid;
    private String checkType;
    private String toolName;
    private String targetReference;
    private String endpointReference;
    private String parameterReference;
    private String expectedCondition;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;

    public static RetestCheckDto fromEntity(RetestCheck check) {
        if (check == null) return null;
        return RetestCheckDto.builder()
                .id(check.getId() != null ? check.getId().toString() : null)
                .uuid(check.getUuid())
                .checkType(check.getCheckType() != null ? check.getCheckType().name() : null)
                .toolName(check.getToolName())
                .targetReference(check.getTargetReference())
                .endpointReference(check.getEndpointReference())
                .parameterReference(check.getParameterReference())
                .expectedCondition(check.getExpectedCondition())
                .status(check.getStatus() != null ? check.getStatus().name() : null)
                .createdAt(check.getCreatedAt())
                .startedAt(check.getStartedAt())
                .completedAt(check.getCompletedAt())
                .build();
    }
}
