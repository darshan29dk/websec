package com.aegis.report.service;

import com.aegis.finding.entity.SecurityFinding;
import com.aegis.report.entity.ReportFormat;
import com.aegis.report.entity.ReportType;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class PdfReportRenderer implements ReportRenderer {

    @Override
    public ReportFormat getFormat() {
        return ReportFormat.PDF;
    }

    @Override
    public byte[] render(ReportType reportType, String reportTitle, ReportDataAggregator.SecurityDataSnapshot snapshot) {
        StringBuilder sb = new StringBuilder();
        sb.append("%PDF-1.4\n");
        sb.append("% GlobalShield Security Platform — ").append(reportTitle).append("\n");
        sb.append("Target: ").append(snapshot.getTarget() != null ? snapshot.getTarget().getName() : "N/A").append("\n");
        sb.append("Report Type: ").append(reportType.name()).append("\n");
        sb.append("Generated At: ").append(snapshot.getSnapshotTimestamp()).append("\n");
        sb.append("Posture Score: ").append(snapshot.getPostureSnapshot() != null ? snapshot.getPostureSnapshot().getOverallScore() + "/100" : "N/A").append("\n\n");
        sb.append("--- FINDINGS SUMMARY ---\n");

        if (snapshot.getFindings() != null) {
            for (SecurityFinding f : snapshot.getFindings()) {
                sb.append("[").append(f.getSeverity()).append("] ").append(f.getTitle()).append(" - Status: ").append(f.getStatus()).append("\n");
            }
        }
        sb.append("\n%%EOF\n");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
