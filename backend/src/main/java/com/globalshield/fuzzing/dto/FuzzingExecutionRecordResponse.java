package com.globalshield.fuzzing.dto;

import com.globalshield.finding.entity.FindingConfidence;
import com.globalshield.fuzzing.entity.FuzzingExecutionRecord;
import com.globalshield.fuzzing.entity.TestResultClassification;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingExecutionRecordResponse {

    private UUID id;
    private UUID campaignId;
    private UUID testCaseId;
    private String testCaseName;
    private String category;
    private String parameterName;
    private String payloadType;
    private String requestUrl;
    private String requestMethod;
    private String requestHeadersSanitized;
    private String requestBodySanitized;
    private Integer responseStatus;
    private Long responseTimeMs;
    private String responseHeadersSanitized;
    private String responseBodySnippet;
    private String responseHash;
    private Integer baselineStatus;
    private String baselineDiffSummary;
    private TestResultClassification resultClassification;
    private FindingConfidence confidence;
    private String anomalyDetails;
    private UUID findingId;
    private String errorMessage;
    private Instant executedAt;

    public static FuzzingExecutionRecordResponse fromEntity(FuzzingExecutionRecord r) {
        return FuzzingExecutionRecordResponse.builder()
                .id(r.getId())
                .campaignId(r.getCampaign() != null ? r.getCampaign().getId() : null)
                .testCaseId(r.getTestCase() != null ? r.getTestCase().getId() : null)
                .testCaseName(r.getTestCase() != null ? r.getTestCase().getName() : null)
                .category(r.getTestCase() != null ? r.getTestCase().getCategory() : null)
                .parameterName(r.getTestCase() != null ? r.getTestCase().getParameterName() : null)
                .payloadType(r.getTestCase() != null ? r.getTestCase().getPayloadType() : null)
                .requestUrl(r.getRequestUrl())
                .requestMethod(r.getRequestMethod())
                .requestHeadersSanitized(r.getRequestHeadersSanitized())
                .requestBodySanitized(r.getRequestBodySanitized())
                .responseStatus(r.getResponseStatus())
                .responseTimeMs(r.getResponseTimeMs())
                .responseHeadersSanitized(r.getResponseHeadersSanitized())
                .responseBodySnippet(r.getResponseBodySnippet())
                .responseHash(r.getResponseHash())
                .baselineStatus(r.getBaselineStatus())
                .baselineDiffSummary(r.getBaselineDiffSummary())
                .resultClassification(r.getResultClassification())
                .confidence(r.getConfidence())
                .anomalyDetails(r.getAnomalyDetails())
                .findingId(r.getFinding() != null ? r.getFinding().getId() : null)
                .errorMessage(r.getErrorMessage())
                .executedAt(r.getExecutedAt())
                .build();
    }
}
