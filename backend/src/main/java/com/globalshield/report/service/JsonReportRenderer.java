package com.globalshield.report.service;

import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.report.entity.ReportFormat;
import com.globalshield.report.entity.ReportType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class JsonReportRenderer implements ReportRenderer {

    private final ObjectMapper mapper;

    public JsonReportRenderer() {
        this.mapper = new ObjectMapper();
        this.mapper.registerModule(new JavaTimeModule());
    }

    @Override
    public ReportFormat getFormat() {
        return ReportFormat.JSON;
    }

    @Override
    public byte[] render(ReportType reportType, String reportTitle, ReportDataAggregator.SecurityDataSnapshot snapshot) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("reportTitle", reportTitle);
            data.put("reportType", reportType.name());
            data.put("generatedAt", snapshot.getSnapshotTimestamp().toString());
            data.put("target", snapshot.getTarget() != null ? Map.of("id", snapshot.getTarget().getId(), "name", snapshot.getTarget().getName(), "url", snapshot.getTarget().getPrimaryUrl()) : null);
            data.put("assessmentId", snapshot.getAssessment() != null ? snapshot.getAssessment().getId() : null);
            data.put("postureScore", snapshot.getPostureSnapshot() != null ? snapshot.getPostureSnapshot().getOverallScore() : null);
            data.put("riskLevel", snapshot.getPostureSnapshot() != null ? snapshot.getPostureSnapshot().getRiskLevel().name() : null);

            List<Map<String, Object>> findingList = snapshot.getFindings() != null ? snapshot.getFindings().stream().map(f -> Map.<String, Object>of(
                "id", f.getId().toString(),
                "title", f.getTitle(),
                "severity", f.getSeverity().name(),
                "confidence", f.getConfidence().name(),
                "status", f.getStatus().name(),
                "source", f.getSource()
            )).toList() : List.of();

            data.put("findings", findingList);

            return mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);
        } catch (Exception e) {
            throw new RuntimeException("Failed to render JSON report", e);
        }
    }
}
