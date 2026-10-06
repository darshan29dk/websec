package com.aegis.security.tool.parser;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.result.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class WhatWebParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, String rawOutput) {
        List<AssessmentAsset> assets = new ArrayList<>();
        if (rawOutput == null || rawOutput.isBlank()) return assets;

        try {
            JsonNode rootArray = objectMapper.readTree(rawOutput);
            if (rootArray.isArray()) {
                for (JsonNode item : rootArray) {
                    if (item.has("plugins")) {
                        JsonNode plugins = item.get("plugins");
                        plugins.fieldNames().forEachRemaining(pluginName -> {
                            JsonNode pluginData = plugins.get(pluginName);
                            String version = "";
                            if (pluginData.has("version") && pluginData.get("version").isArray() && pluginData.get("version").size() > 0) {
                                version = pluginData.get("version").get(0).asText();
                            }
                            String assetVal = pluginName + (version.isBlank() ? "" : " " + version);

                            AssetType type = pluginName.toLowerCase().contains("server") ? AssetType.WEB_SERVER : AssetType.TECHNOLOGY;
                            assets.add(AssessmentAsset.builder()
                                    .assessment(assessment)
                                    .assetType(type)
                                    .value(assetVal)
                                    .source("WHATWEB")
                                    .confidence("HIGH")
                                    .build());
                        });
                    }
                }
            }
        } catch (Exception e) {
            // Text fallback parsing if json output is not available
            if (rawOutput.contains("[")) {
                String clean = rawOutput.substring(rawOutput.indexOf("["));
                for (String part : clean.split(",")) {
                    if (!part.isBlank()) {
                        assets.add(AssessmentAsset.builder()
                                .assessment(assessment)
                                .assetType(AssetType.TECHNOLOGY)
                                .value(part.replaceAll("[\\[\\]\"]", "").trim())
                                .source("WHATWEB")
                                .confidence("MEDIUM")
                                .build());
                    }
                }
            }
        }
        return assets;
    }

    public List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, String rawOutput) {
        return List.of();
    }

    public List<AssessmentObservation> parseObservations(SecurityAssessment assessment, String rawOutput) {
        List<AssessmentObservation> obs = new ArrayList<>();
        if (rawOutput == null || rawOutput.isBlank()) return obs;

        List<AssessmentAsset> assets = parseAssets(assessment, rawOutput);
        for (AssessmentAsset asset : assets) {
            obs.add(AssessmentObservation.builder()
                    .assessment(assessment)
                    .category("TECHNOLOGY_FINGERPRINT")
                    .title("Detected Technology: " + asset.getValue())
                    .description("WhatWeb fingerprinting detected web technology asset '" + asset.getValue() + "'")
                    .severity(ObservationSeverity.INFO)
                    .confidence(ObservationConfidence.HIGH)
                    .source("WHATWEB")
                    .evidence("Technology: " + asset.getValue())
                    .build());
        }
        return obs;
    }
}
