package com.aegis.report.dto;

import com.aegis.report.entity.ReportFormat;
import com.aegis.report.entity.ReportType;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record CreateReportRequestDto(
    @NotNull ReportType reportType,
    @NotNull ReportFormat format,
    UUID targetId,
    UUID assessmentId,
    UUID incidentId,
    String title,
    Instant periodStart,
    Instant periodEnd
) {}
