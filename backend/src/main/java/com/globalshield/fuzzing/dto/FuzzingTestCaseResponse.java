package com.globalshield.fuzzing.dto;

import com.globalshield.fuzzing.entity.FuzzingTestCase;
import com.globalshield.fuzzing.entity.TestCaseStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingTestCaseResponse {

    private UUID id;
    private UUID campaignId;
    private UUID endpointId;
    private String category;
    private String name;
    private String httpMethod;
    private String targetUrl;
    private String parameterName;
    private String payloadType;
    private String testPayload;
    private String baselinePayload;
    private Integer executionOrder;
    private boolean multiStep;
    private Integer stepIndex;
    private String preconditions;
    private String stopCondition;
    private TestCaseStatus status;
    private Instant createdAt;

    public static FuzzingTestCaseResponse fromEntity(FuzzingTestCase tc) {
        return FuzzingTestCaseResponse.builder()
                .id(tc.getId())
                .campaignId(tc.getCampaign() != null ? tc.getCampaign().getId() : null)
                .endpointId(tc.getEndpoint() != null ? tc.getEndpoint().getId() : null)
                .category(tc.getCategory())
                .name(tc.getName())
                .httpMethod(tc.getHttpMethod())
                .targetUrl(tc.getTargetUrl())
                .parameterName(tc.getParameterName())
                .payloadType(tc.getPayloadType())
                .testPayload(tc.getTestPayload())
                .baselinePayload(tc.getBaselinePayload())
                .executionOrder(tc.getExecutionOrder())
                .multiStep(tc.isMultiStep())
                .stepIndex(tc.getStepIndex())
                .preconditions(tc.getPreconditions())
                .stopCondition(tc.getStopCondition())
                .status(tc.getStatus())
                .createdAt(tc.getCreatedAt())
                .build();
    }
}
