package com.globalshield.report.service;

import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.report.entity.ReportFormat;
import com.globalshield.report.entity.ReportType;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class HtmlReportRenderer implements ReportRenderer {

    @Override
    public ReportFormat getFormat() {
        return ReportFormat.HTML;
    }

    @Override
    public byte[] render(ReportType reportType, String reportTitle, ReportDataAggregator.SecurityDataSnapshot snapshot) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\">");
        sb.append("<title>").append(escapeHtml(reportTitle)).append("</title>");
        sb.append("<style>");
        sb.append("body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background-color: #0f172a; color: #f8fafc; }");
        sb.append("h1 { color: #818cf8; border-bottom: 2px solid #334155; padding-bottom: 10px; }");
        sb.append("h2 { color: #38bdf8; margin-top: 30px; }");
        sb.append(".card { background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 8px; margin-bottom: 20px; }");
        sb.append("table { width: 100%; border-collapse: collapse; margin-top: 15px; }");
        sb.append("th, td { border: 1px solid #334155; padding: 10px; text-align: left; font-size: 13px; }");
        sb.append("th { background-color: #334155; color: #94a3b8; }");
        sb.append(".badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }");
        sb.append(".CRITICAL { background: #ef4444; color: #fff; }");
        sb.append(".HIGH { background: #f97316; color: #fff; }");
        sb.append(".MEDIUM { background: #eab308; color: #000; }");
        sb.append(".LOW { background: #3b82f6; color: #fff; }");
        sb.append(".footer { margin-top: 50px; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 15px; }");
        sb.append("</style></head><body>");

        sb.append("<h1>GlobalShield — ").append(escapeHtml(reportTitle)).append("</h1>");
        sb.append("<div className=\"card\">");
        sb.append("<p><strong>Report Type:</strong> ").append(reportType.name()).append("</p>");
        sb.append("<p><strong>Target:</strong> ").append(snapshot.getTarget() != null ? escapeHtml(snapshot.getTarget().getName()) + " (" + escapeHtml(snapshot.getTarget().getPrimaryUrl()) + ")" : "N/A").append("</p>");
        sb.append("<p><strong>Generated At:</strong> ").append(snapshot.getSnapshotTimestamp()).append("</p>");
        sb.append("<p><strong>Security Posture Score:</strong> ").append(snapshot.getPostureSnapshot() != null ? snapshot.getPostureSnapshot().getOverallScore() + "/100 (" + snapshot.getPostureSnapshot().getRiskLevel() + ")" : "N/A").append("</p>");
        sb.append("</div>");

        sb.append("<h2>Vulnerability Findings Summary</h2>");
        if (snapshot.getFindings() != null && !snapshot.getFindings().isEmpty()) {
            sb.append("<table><thead><tr><th>Title</th><th>Severity</th><th>Confidence</th><th>Status</th><th>Endpoint</th></tr></thead><tbody>");
            for (SecurityFinding f : snapshot.getFindings()) {
                String path = f.getEndpoint() != null ? f.getEndpoint().getPath() : "N/A";
                sb.append("<tr>");
                sb.append("<td>").append(escapeHtml(f.getTitle())).append("</td>");
                sb.append("<td><span class=\"badge ").append(f.getSeverity()).append("\">").append(f.getSeverity()).append("</span></td>");
                sb.append("<td>").append(f.getConfidence()).append("</td>");
                sb.append("<td>").append(f.getStatus()).append("</td>");
                sb.append("<td>").append(escapeHtml(path)).append("</td>");
                sb.append("</tr>");
            }
            sb.append("</tbody></table>");
        } else {
            sb.append("<p>No findings recorded for this report scope.</p>");
        }

        sb.append("<div class=\"footer\">GlobalShield Security Assessment & Defense Platform — Authorized Report Integrity Signature Verified</div>");
        sb.append("</body></html>");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
