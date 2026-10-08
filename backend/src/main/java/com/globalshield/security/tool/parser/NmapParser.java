package com.globalshield.security.tool.parser;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.result.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class NmapParser {

    // Regex match for Nmap port output line: 80/tcp open http Apache httpd 2.4.41
    private static final Pattern PORT_LINE_PATTERN = Pattern.compile(
            "^(\\d+)/(tcp|udp)\\s+(open|filtered|closed)\\s+(\\S+)(?:\\s+(.*))?$",
            Pattern.MULTILINE
    );

    private static final Pattern NMAP_IP_PATTERN = Pattern.compile(
            "Nmap scan report for .*? \\((?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\)|Nmap scan report for ((?:[0-9]{1,3}\\.){3}[0-9]{1,3})"
    );

    public List<AssessmentAsset> parseAssets(SecurityAssessment assessment, String rawOutput) {
        List<AssessmentAsset> assets = new ArrayList<>();
        if (rawOutput == null || rawOutput.isBlank()) return assets;

        Matcher lineMatcher = PORT_LINE_PATTERN.matcher(rawOutput);
        while (lineMatcher.find()) {
            String port = lineMatcher.group(1);
            String proto = lineMatcher.group(2);
            String state = lineMatcher.group(3);
            String service = lineMatcher.group(4);
            String versionInfo = lineMatcher.group(5);

            if ("open".equalsIgnoreCase(state)) {
                assets.add(AssessmentAsset.builder()
                        .assessment(assessment)
                        .assetType(AssetType.PORT)
                        .value(port + "/" + proto)
                        .source("NMAP")
                        .confidence("HIGH")
                        .build());

                assets.add(AssessmentAsset.builder()
                        .assessment(assessment)
                        .assetType(AssetType.SERVICE)
                        .value(service + (versionInfo != null && !versionInfo.isBlank() ? " (" + versionInfo.trim() + ")" : ""))
                        .source("NMAP")
                        .confidence("HIGH")
                        .build());
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

        Matcher lineMatcher = PORT_LINE_PATTERN.matcher(rawOutput);
        while (lineMatcher.find()) {
            String port = lineMatcher.group(1);
            String proto = lineMatcher.group(2);
            String state = lineMatcher.group(3);
            String service = lineMatcher.group(4);
            String version = lineMatcher.group(5);

            if ("open".equalsIgnoreCase(state)) {
                obs.add(AssessmentObservation.builder()
                        .assessment(assessment)
                        .category("PORT_DISCOVERY")
                        .title("Open Service Port " + port + "/" + proto + " (" + service + ")")
                        .description("Conservative port discovery detected active service '" + service + "' on port " + port + "/" + proto)
                        .severity(ObservationSeverity.INFO)
                        .confidence(ObservationConfidence.HIGH)
                        .source("NMAP")
                        .evidence("Port: " + port + "/" + proto + " | Service: " + service + (version != null ? " | Version: " + version : ""))
                        .build());
            }
        }
        return obs;
    }
}
