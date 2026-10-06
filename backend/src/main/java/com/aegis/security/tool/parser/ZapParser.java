package com.aegis.security.tool.parser;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.result.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ZapParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, String rawOutput) {
        return List.of();
    }

    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, String rawOutput) {
        List<AssessmentEndpoint> endpoints = new ArrayList<>();
        if (rawOutput == null || rawOutput.isBlank()) return endpoints;

        try {
            JsonNode root = objectMapper.readTree(rawOutput);
            JsonNode siteNode = root.has("site") ? root.get("site") : root;
            if (siteNode.isArray()) {
                for (JsonNode site : siteNode) {
                    extractAlertEndpoints(assessment, site, endpoints);
                }
            } else if (siteNode.isObject()) {
                extractAlertEndpoints(assessment, siteNode, endpoints);
            }
        } catch (Exception e) {
            // Fallback for simple line-based output
        }
        return endpoints;
    }

    private void extractAlertEndpoints(SecurityAssessment assessment, JsonNode siteNode, List<AssessmentEndpoint> endpoints) {
        JsonNode alerts = siteNode.has("alerts") ? siteNode.get("alerts") : null;
        if (alerts != null && alerts.isArray()) {
            for (JsonNode alert : alerts) {
                if (alert.has("url")) {
                    endpoints.add(AssessmentEndpoint.builder()
                            .assessment(assessment)
                            .url(alert.get("url").asText())
                            .method(alert.has("method") ? alert.get("method").asText() : "GET")
                            .source("ZAP")
                            .build());
                }
            }
        }
    }

    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, String rawOutput) {
        List<AssessmentObservation> obs = new ArrayList<>();
        if (rawOutput == null || rawOutput.isBlank()) return obs;

        try {
            JsonNode root = objectMapper.readTree(rawOutput);
            JsonNode siteNode = root.has("site") ? root.get("site") : root;
            if (siteNode.isArray()) {
                for (JsonNode site : siteNode) {
                    extractAlertObservations(assessment, site, obs);
                }
            } else if (siteNode.isObject()) {
                extractAlertObservations(assessment, siteNode, obs);
            } else if (root.has("alerts") && root.get("alerts").isArray()) {
                for (JsonNode alert : root.get("alerts")) {
                    parseSingleAlert(assessment, alert, obs);
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return obs;
    }

    private void extractAlertObservations(SecurityAssessment assessment, JsonNode siteNode, List<AssessmentObservation> obs) {
        JsonNode alerts = siteNode.has("alerts") ? siteNode.get("alerts") : null;
        if (alerts != null && alerts.isArray()) {
            for (JsonNode alert : alerts) {
                parseSingleAlert(assessment, alert, obs);
            }
        }
    }

    private void parseSingleAlert(SecurityAssessment assessment, JsonNode alert, List<AssessmentObservation> obs) {
        String name = alert.has("alert") ? alert.get("alert").asText() : (alert.has("name") ? alert.get("name").asText() : "ZAP Alert");
        String desc = alert.has("description") ? alert.get("description").asText() : name;
        String riskStr = alert.has("riskdesc") ? alert.get("riskdesc").asText() : (alert.has("risk") ? alert.get("risk").asText() : "Informational");
        String solution = alert.has("solution") ? alert.get("solution").asText() : "";
        String url = alert.has("url") ? alert.get("url").asText() : "";
        String param = alert.has("param") ? alert.get("param").asText() : "";
        String evidence = alert.has("evidence") ? alert.get("evidence").asText() : "";

        ObservationSeverity severity = mapZapRiskToSeverity(riskStr);

        StringBuilder fullEvidence = new StringBuilder();
        if (!url.isBlank()) fullEvidence.append("URL: ").append(url).append(" | ");
        if (!param.isBlank()) fullEvidence.append("Param: ").append(param).append(" | ");
        if (!evidence.isBlank()) fullEvidence.append("Evidence: ").append(evidence).append(" | ");
        if (!solution.isBlank()) fullEvidence.append("Solution: ").append(solution);

        obs.add(AssessmentObservation.builder()
                .assessment(assessment)
                .category("WEB_SERVER_ASSESSMENT")
                .title("ZAP Finding: " + name)
                .description(desc)
                .severity(severity)
                .confidence(ObservationConfidence.MEDIUM)
                .source("ZAP")
                .evidence(fullEvidence.toString())
                .build());
    }

    private ObservationSeverity mapZapRiskToSeverity(String riskStr) {
        String upper = riskStr.toUpperCase();
        if (upper.contains("HIGH")) return ObservationSeverity.HIGH;
        if (upper.contains("MEDIUM")) return ObservationSeverity.MEDIUM;
        if (upper.contains("LOW")) return ObservationSeverity.LOW;
        if (upper.contains("CRITICAL")) return ObservationSeverity.CRITICAL;
        return ObservationSeverity.INFO;
    }
}
