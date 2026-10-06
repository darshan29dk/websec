package com.aegis.security.tool.parser;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.result.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class NucleiParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, String rawOutput) {
        return List.of();
    }

    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, String rawOutput) {
        List<AssessmentEndpoint> endpoints = new ArrayList<>();
        if (rawOutput == null || rawOutput.isBlank()) return endpoints;

        String[] lines = rawOutput.split("\n");
        for (String line : lines) {
            if (line.trim().startsWith("{")) {
                try {
                    JsonNode node = objectMapper.readTree(line);
                    if (node.has("matched-at")) {
                        endpoints.add(AssessmentEndpoint.builder()
                                .assessment(assessment)
                                .url(node.get("matched-at").asText())
                                .method("GET")
                                .source("NUCLEI")
                                .build());
                    }
                } catch (Exception e) {
                    // Safe fallback
                }
            }
        }
        return endpoints;
    }

    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, String rawOutput) {
        List<AssessmentObservation> obs = new ArrayList<>();
        if (rawOutput == null || rawOutput.isBlank()) return obs;

        String[] lines = rawOutput.split("\n");
        for (String line : lines) {
            if (line.trim().startsWith("{")) {
                try {
                    JsonNode node = objectMapper.readTree(line);
                    String templateId = node.has("template-id") ? node.get("template-id").asText() : "nuclei-template";
                    String matchedAt = node.has("matched-at") ? node.get("matched-at").asText() : "";
                    
                    JsonNode info = node.get("info");
                    String name = info != null && info.has("name") ? info.get("name").asText() : templateId;
                    String desc = info != null && info.has("description") ? info.get("description").asText() : name;
                    String sevStr = info != null && info.has("severity") ? info.get("severity").asText().toUpperCase() : "INFO";

                    ObservationSeverity severity;
                    try {
                        severity = ObservationSeverity.valueOf(sevStr);
                    } catch (Exception e) {
                        severity = ObservationSeverity.INFO;
                    }

                    obs.add(AssessmentObservation.builder()
                            .assessment(assessment)
                            .category("VULNERABILITY_ASSESSMENT")
                            .title("Nuclei Finding: " + name)
                            .description(desc)
                            .severity(severity)
                            .confidence(ObservationConfidence.HIGH)
                            .source("NUCLEI")
                            .evidence("Template ID: " + templateId + " | Matched At: " + matchedAt)
                            .build());
                } catch (Exception e) {
                    // Safe fallback
                }
            }
        }
        return obs;
    }
}
