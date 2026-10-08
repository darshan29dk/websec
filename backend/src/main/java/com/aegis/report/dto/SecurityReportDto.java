package com.aegis.report.dto;

import com.aegis.report.entity.ReportFormat;
import com.aegis.report.entity.ReportStatus;
import com.aegis.report.entity.ReportType;

import java.time.Instant;

public record SecurityReportDto(
    String id,
    String uuid,
    ReportType reportType,
    String title,
    String targetId,
    String targetName,
    String assessmentId,
    String incidentId,
    String generatedBy,
    ReportStatus status,
    ReportFormat format,
    Instant periodStart,
    Instant periodEnd,
    String checksum,
    long fileSize,
    String errorMessage,
    Instant createdAt,
    Instant completedAt
) {}
