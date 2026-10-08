package com.globalshield.report;

import com.globalshield.report.entity.ReportFormat;
import com.globalshield.report.entity.ReportType;
import com.globalshield.report.service.CsvReportRenderer;
import com.globalshield.report.service.HtmlReportRenderer;
import com.globalshield.report.service.JsonReportRenderer;
import com.globalshield.report.service.ReportDataAggregator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReportServiceTest {

    @Test
    @DisplayName("HTML Report Renderer produces valid HTML structure")
    void testHtmlReportRenderer() {
        HtmlReportRenderer renderer = new HtmlReportRenderer();
        assertEquals(ReportFormat.HTML, renderer.getFormat());

        var snapshot = ReportDataAggregator.SecurityDataSnapshot.builder()
            .findings(List.of())
            .snapshotTimestamp(Instant.now())
            .build();

        byte[] output = renderer.render(ReportType.TECHNICAL_SECURITY_REPORT, "Test Technical Report", snapshot);
        assertNotNull(output);
        String html = new String(output);
        assertTrue(html.contains("<!DOCTYPE html>"));
        assertTrue(html.contains("Test Technical Report"));
    }

    @Test
    @DisplayName("CSV Report Renderer generates header and rows")
    void testCsvReportRenderer() {
        CsvReportRenderer renderer = new CsvReportRenderer();
        assertEquals(ReportFormat.CSV, renderer.getFormat());

        var snapshot = ReportDataAggregator.SecurityDataSnapshot.builder()
            .findings(List.of())
            .snapshotTimestamp(Instant.now())
            .build();

        byte[] output = renderer.render(ReportType.VULNERABILITY_REPORT, "Vulnerability CSV Export", snapshot);
        assertNotNull(output);
        String csv = new String(output);
        assertTrue(csv.contains("Finding ID,Title,Severity,Confidence,Status,Source,Endpoint,Created At"));
    }

    @Test
    @DisplayName("JSON Report Renderer outputs structured JSON")
    void testJsonReportRenderer() {
        JsonReportRenderer renderer = new JsonReportRenderer();
        assertEquals(ReportFormat.JSON, renderer.getFormat());

        var snapshot = ReportDataAggregator.SecurityDataSnapshot.builder()
            .findings(List.of())
            .snapshotTimestamp(Instant.now())
            .build();

        byte[] output = renderer.render(ReportType.EXECUTIVE_SECURITY_REPORT, "Executive JSON Data", snapshot);
        assertNotNull(output);
        String json = new String(output);
        assertTrue(json.contains("\"reportTitle\" : \"Executive JSON Data\""));
    }
}
