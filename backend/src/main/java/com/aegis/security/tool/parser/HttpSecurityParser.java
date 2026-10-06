package com.aegis.security.tool.parser;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.result.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class HttpSecurityParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, String jsonOutput) {
        List<AssessmentAsset> assets = new ArrayList<>();
        if (jsonOutput == null || jsonOutput.isBlank()) return assets;

        try {
            JsonNode root = objectMapper.readTree(jsonOutput);
            if (root.has("serverHeader") && !root.get("serverHeader").asText().isBlank()) {
                assets.add(AssessmentAsset.builder()
                        .assessment(assessment)
                        .assetType(AssetType.WEB_SERVER)
                        .value(root.get("serverHeader").asText())
                        .source("HTTP_SECURITY_ANALYZER")
                        .confidence("HIGH")
                        .build());
            }

            if (root.has("technologies")) {
                for (JsonNode tech : root.get("technologies")) {
                    assets.add(AssessmentAsset.builder()
                            .assessment(assessment)
                            .assetType(AssetType.TECHNOLOGY)
                            .value(tech.asText())
                            .source("HTTP_SECURITY_ANALYZER")
                            .confidence("HIGH")
                            .build());
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return assets;
    }

    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, String jsonOutput) {
        List<AssessmentEndpoint> endpoints = new ArrayList<>();
        if (jsonOutput == null || jsonOutput.isBlank()) return endpoints;

        try {
            JsonNode root = objectMapper.readTree(jsonOutput);
            String url = root.has("url") ? root.get("url").asText() : assessment.getTarget().getPrimaryUrl();
            int statusCode = root.has("statusCode") ? root.get("statusCode").asInt() : 200;
            String contentType = root.has("contentType") ? root.get("contentType").asText() : "text/html";

            endpoints.add(AssessmentEndpoint.builder()
                    .assessment(assessment)
                    .url(url)
                    .method("GET")
                    .statusCode(statusCode)
                    .contentType(contentType)
                    .source("HTTP_SECURITY_ANALYZER")
                    .build());
        } catch (Exception e) {
            endpoints.add(AssessmentEndpoint.builder()
                    .assessment(assessment)
                    .url(assessment.getTarget().getPrimaryUrl())
                    .method("GET")
                    .source("HTTP_SECURITY_ANALYZER")
                    .build());
        }
        return endpoints;
    }

    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, String jsonOutput) {
        List<AssessmentObservation> obs = new ArrayList<>();
        if (jsonOutput == null || jsonOutput.isBlank()) return obs;

        try {
            JsonNode root = objectMapper.readTree(jsonOutput);
            if (root.has("observations")) {
                for (JsonNode item : root.get("observations")) {
                    obs.add(AssessmentObservation.builder()
                            .assessment(assessment)
                            .category(item.has("category") ? item.get("category").asText() : "HTTP_HEADER_ANALYSIS")
                            .title(item.has("title") ? item.get("title").asText() : "HTTP Header Finding")
                            .description(item.has("description") ? item.get("description").asText() : "")
                            .severity(ObservationSeverity.valueOf(item.has("severity") ? item.get("severity").asText() : "INFO"))
                            .confidence(ObservationConfidence.valueOf(item.has("confidence") ? item.get("confidence").asText() : "HIGH"))
                            .source("HTTP_SECURITY_ANALYZER")
                            .evidence(item.has("evidence") ? item.get("evidence").asText() : "")
                            .build());
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return obs;
    }
}
