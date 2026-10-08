package com.aegis.report.controller;

import com.aegis.common.PageResponse;
import com.aegis.report.dto.CreateReportRequestDto;
import com.aegis.report.dto.ReportDownloadDto;
import com.aegis.report.dto.SecurityReportDto;
import com.aegis.report.entity.ReportFormat;
import com.aegis.report.entity.ReportStatus;
import com.aegis.report.entity.ReportType;
import com.aegis.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<SecurityReportDto> createReport(
        @Valid @RequestBody CreateReportRequestDto dto,
        Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(reportService.createReport(dto, userEmail));
    }

    @GetMapping
    public ResponseEntity<PageResponse<SecurityReportDto>> searchReports(
        @RequestParam(required = false) UUID targetId,
        @RequestParam(required = false) ReportType reportType,
        @RequestParam(required = false) ReportStatus status,
        @RequestParam(required = false) ReportFormat format,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(reportService.searchReports(targetId, reportType, status, format, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SecurityReportDto> getReportById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<ReportStatus> getReportStatus(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(reportService.getReportById(id).status());
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadReport(
        @PathVariable("id") UUID id,
        Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "admin@aegis.local";
        ReportDownloadDto download = reportService.downloadReport(id, userEmail);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.filename() + "\"")
            .header("X-Report-Checksum-SHA256", download.checksum())
            .header("X-Report-Size-Bytes", String.valueOf(download.size()))
            .contentType(MediaType.parseMediaType(download.contentType()))
            .body(download.content());
    }

    @PostMapping("/{id}/regenerate")
    public ResponseEntity<SecurityReportDto> regenerateReport(
        @PathVariable("id") UUID id,
        Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(reportService.regenerateReport(id, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(
        @PathVariable("id") UUID id,
        Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "admin@aegis.local";
        reportService.deleteReport(id, userEmail);
        return ResponseEntity.noContent().build();
    }
}
