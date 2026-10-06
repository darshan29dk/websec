package com.aegis.security.tool.parser;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.result.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class NiktoParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, String rawOutput) {
        return List.of();
    }

    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, String rawOutput) {
        return List.of();
    }

    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, String rawOutput) {
        List<AssessmentObservation> obs = new ArrayList<>();
        if (rawOutput == null || rawOutput.isBlank()) return obs;

        String trimmed = rawOutput.trim();
        if (trimmed.startsWith("{")) {
            try {
                JsonNode root = objectMapper.readTree(trimmed);
                JsonNode items = root.has("vulnerabilities") ? root.get("vulnerabilities") : (root.has("items") ? root.get("items") : null);
                if (items != null && items.isArray()) {
                    for (JsonNode item : items) {
                        String msg = item.has("msg") ? item.get("msg").asText() : (item.has("title") ? item.get("title").asText() : "Nikto Finding");
                        obs.add(AssessmentObservation.builder()
                                .assessment(assessment)
                                .category("WEB_SERVER_ASSESSMENT")
                                .title("Nikto Observation: " + (msg.length() > 60 ? msg.substring(0, 60) + "..." : msg))
                                .description(msg)
                                .severity(ObservationSeverity.MEDIUM)
                                .confidence(ObservationConfidence.MEDIUM)
                                .source("NIKTO")
                                .evidence(msg)
                                .build());
                    }
                }
            } catch (Exception e) {
                // Fallback to text parser
            }
        }

        if (obs.isEmpty()) {
            String[] lines = rawOutput.split("\n");
            for (String line : lines) {
                String lineTrimmed = line.trim();
                if (lineTrimmed.startsWith("+ ")) {
                    String finding = lineTrimmed.substring(2).trim();
                    if (!finding.contains("Target IP:") && !finding.contains("Target Hostname:") && !finding.contains("End Time:")) {
                        ObservationSeverity severity = ObservationSeverity.INFO;
                        if (finding.toLowerCase().contains("vulnerability") || finding.toLowerCase().contains("outdated") || finding.toLowerCase().contains("xss")) {
                            severity = ObservationSeverity.LOW;
                        }

                        obs.add(AssessmentObservation.builder()
                                .assessment(assessment)
                                .category("WEB_SERVER_ASSESSMENT")
                                .title("Nikto Observation: " + (finding.length() > 60 ? finding.substring(0, 60) + "..." : finding))
                                .description(finding)
                                .severity(severity)
                                .confidence(ObservationConfidence.MEDIUM)
                                .source("NIKTO")
                                .evidence(finding)
                                .build());
                    }
                }
            }
        }
        return obs;
    }
}
