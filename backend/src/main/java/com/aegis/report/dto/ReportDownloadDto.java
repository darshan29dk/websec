package com.aegis.report.dto;

import com.aegis.report.entity.ReportFormat;

import java.time.Instant;

public record ReportDownloadDto(
    String reportId,
    String filename,
    String contentType,
    long size,
    String checksum,
    ReportFormat format,
    byte[] content,
    Instant generatedAt
) {}
