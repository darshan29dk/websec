package com.aegis.report.service;

import com.aegis.report.entity.ReportFormat;
import com.aegis.report.entity.ReportType;

public interface ReportRenderer {
    ReportFormat getFormat();
    byte[] render(ReportType reportType, String reportTitle, ReportDataAggregator.SecurityDataSnapshot snapshot);
}
