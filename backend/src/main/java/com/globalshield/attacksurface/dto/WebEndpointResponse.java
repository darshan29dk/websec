package com.globalshield.attacksurface.dto;

import com.globalshield.attacksurface.entity.EndpointType;
import com.globalshield.attacksurface.entity.WebEndpoint;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class WebEndpointResponse {
    private UUID id;
    private UUID assessmentId;
    private String url;
    private String normalizedUrl;
    private String path;
    private String method;
    private EndpointType endpointType;
    private Integer statusCode;
    private String contentType;
    private boolean parametersPresent;
    private boolean authenticationObserved;
    private String source;
    private String confidence;
    private Instant firstSeenAt;
    private Instant lastSeenAt;

    public static WebEndpointResponse fromEntity(WebEndpoint entity) {
        return WebEndpointResponse.builder()
                .id(entity.getId())
                .assessmentId(entity.getAssessment() != null ? entity.getAssessment().getId() : null)
                .url(entity.getUrl())
                .normalizedUrl(entity.getNormalizedUrl())
                .path(entity.getPath())
                .method(entity.getMethod())
                .endpointType(entity.getEndpointType())
                .statusCode(entity.getStatusCode())
                .contentType(entity.getContentType())
                .parametersPresent(entity.isParametersPresent())
                .authenticationObserved(entity.isAuthenticationObserved())
                .source(entity.getSource())
                .confidence(entity.getConfidence())
                .firstSeenAt(entity.getFirstSeenAt())
                .lastSeenAt(entity.getLastSeenAt())
                .build();
    }
}
