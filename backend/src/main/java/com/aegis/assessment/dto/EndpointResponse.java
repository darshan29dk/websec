package com.aegis.assessment.dto;

import com.aegis.assessment.result.AssessmentEndpoint;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EndpointResponse {
    private UUID id;
    private UUID assessmentId;
    private String url;
    private String method;
    private Integer statusCode;
    private String contentType;
    private String source;
    private Instant discoveredAt;

    public static EndpointResponse fromEntity(AssessmentEndpoint endpoint) {
        return EndpointResponse.builder()
                .id(endpoint.getId())
                .assessmentId(endpoint.getAssessment() != null ? endpoint.getAssessment().getId() : null)
                .url(endpoint.getUrl())
                .method(endpoint.getMethod())
                .statusCode(endpoint.getStatusCode())
                .contentType(endpoint.getContentType())
                .source(endpoint.getSource())
                .discoveredAt(endpoint.getDiscoveredAt())
                .build();
    }
}
