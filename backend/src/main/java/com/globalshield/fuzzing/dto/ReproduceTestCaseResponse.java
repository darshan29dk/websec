package com.globalshield.fuzzing.dto;

import com.globalshield.fuzzing.entity.TestResultClassification;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReproduceTestCaseResponse {

    private UUID testCaseId;
    private String requestUrl;
    private String requestMethod;
    private String requestHeadersSanitized;
    private String requestBodySanitized;
    private Integer responseStatus;
    private Long responseTimeMs;
    private String responseHeadersSanitized;
    private String responseBodySnippet;
    private TestResultClassification classification;
    private String anomalyDetails;
    private boolean reproduced;
    private String summaryMessage;
    private Instant executedAt;
}
