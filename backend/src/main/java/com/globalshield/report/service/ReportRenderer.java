package com.globalshield.report.service;

import com.globalshield.report.entity.ReportFormat;
import com.globalshield.report.entity.ReportType;

public interface ReportRenderer {
    ReportFormat getFormat();
    byte[] render(ReportType reportType, String reportTitle, ReportDataAggregator.SecurityDataSnapshot snapshot);
}
