package com.aegis.report.service;

import com.aegis.finding.entity.SecurityFinding;
import com.aegis.report.entity.ReportFormat;
import com.aegis.report.entity.ReportType;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class CsvReportRenderer implements ReportRenderer {

    @Override
    public ReportFormat getFormat() {
        return ReportFormat.CSV;
    }

    @Override
    public byte[] render(ReportType reportType, String reportTitle, ReportDataAggregator.SecurityDataSnapshot snapshot) {
        StringBuilder sb = new StringBuilder();
        sb.append("Finding ID,Title,Severity,Confidence,Status,Source,Endpoint,Created At\n");

        if (snapshot.getFindings() != null) {
            for (SecurityFinding f : snapshot.getFindings()) {
                String path = f.getEndpoint() != null ? f.getEndpoint().getPath() : "";
                sb.append("\"").append(f.getId()).append("\",");
                sb.append("\"").append(escapeCsv(f.getTitle())).append("\",");
                sb.append("\"").append(f.getSeverity()).append("\",");
                sb.append("\"").append(f.getConfidence()).append("\",");
                sb.append("\"").append(f.getStatus()).append("\",");
                sb.append("\"").append(escapeCsv(f.getSource())).append("\",");
                sb.append("\"").append(escapeCsv(path)).append("\",");
                sb.append("\"").append(f.getCreatedAt()).append("\"\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String str) {
        if (str == null) return "";
        return str.replace("\"", "\"\"");
    }
}
