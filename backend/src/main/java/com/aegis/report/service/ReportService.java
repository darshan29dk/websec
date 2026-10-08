package com.aegis.report.service;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.SecurityAssessmentRepository;
import com.aegis.audit.AuditEventType;
import com.aegis.audit.AuditService;
import com.aegis.common.PageResponse;
import com.aegis.report.dto.CreateReportRequestDto;
import com.aegis.report.dto.ReportDownloadDto;
import com.aegis.report.dto.SecurityReportDto;
import com.aegis.report.entity.ReportFormat;
import com.aegis.report.entity.ReportStatus;
import com.aegis.report.entity.ReportType;
import com.aegis.report.entity.SecurityReport;
import com.aegis.report.repository.SecurityReportRepository;
import com.aegis.target.SecurityTarget;
import com.aegis.target.SecurityTargetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final SecurityReportRepository reportRepository;
    private final SecurityTargetRepository targetRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final ReportDataAggregator dataAggregator;
    private final List<ReportRenderer> renderers;
    private final ReportStorageService storageService;
    private final AuditService auditService;

    @Transactional
    public SecurityReportDto createReport(CreateReportRequestDto dto, String userEmail) {
        SecurityTarget target = dto.targetId() != null ? targetRepository.findById(dto.targetId()).orElse(null) : null;
        SecurityAssessment assessment = dto.assessmentId() != null ? assessmentRepository.findById(dto.assessmentId()).orElse(null) : null;

        String title = dto.title() != null && !dto.title().isBlank()
            ? dto.title()
            : formatTitle(dto.reportType(), target);

        SecurityReport report = SecurityReport.builder()
            .reportType(dto.reportType())
            .title(title)
            .target(target)
            .assessment(assessment)
            .generatedBy(userEmail != null ? userEmail : "SYSTEM")
            .status(ReportStatus.QUEUED)
            .format(dto.format())
            .periodStart(dto.periodStart())
            .periodEnd(dto.periodEnd())
            .createdAt(Instant.now())
            .build();

        report = reportRepository.save(report);

        auditService.logEvent(
            null, userEmail != null ? userEmail : "SYSTEM",
            AuditEventType.REPORT_CREATED,
            "SECURITY_REPORT", report.getId().toString(),
            "CREATE_REPORT", "Queued generation for report: " + title,
            null, null
        );

        // Async execution
        generateReportAsync(report.getId());

        return toDto(report);
    }

    @Async
    public void generateReportAsync(UUID reportId) {
        SecurityReport report = reportRepository.findById(reportId).orElse(null);
        if (report == null) return;

        try {
            report.setStatus(ReportStatus.GENERATING);
            reportRepository.save(report);

            var snapshot = dataAggregator.aggregate(
                report.getTarget() != null ? report.getTarget().getId() : null,
                report.getAssessment() != null ? report.getAssessment().getId() : null,
                report.getIncident() != null ? report.getIncident().getId() : null
            );

            ReportRenderer renderer = renderers.stream()
                .filter(r -> r.getFormat() == report.getFormat())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No renderer registered for format: " + report.getFormat()));

            byte[] content = renderer.render(report.getReportType(), report.getTitle(), snapshot);
            String storageRef = storageService.storeReport(report.getUuid(), report.getFormat().name(), content);
            String checksum = computeSha256(content);

            report.setStorageReference(storageRef);
            report.setChecksum(checksum);
            report.setFileSize(content.length);
            report.setStatus(ReportStatus.COMPLETED);
            report.setCompletedAt(Instant.now());
            reportRepository.save(report);

            auditService.logEvent(
                null, report.getGeneratedBy(),
                AuditEventType.REPORT_GENERATED,
                "SECURITY_REPORT", report.getId().toString(),
                "GENERATE_REPORT", "Report " + report.getTitle() + " generated successfully (" + content.length + " bytes)",
                null, null
            );

        } catch (Exception e) {
            log.error("Failed to generate report {}", reportId, e);
            report.setStatus(ReportStatus.FAILED);
            report.setErrorMessage(e.getMessage());
            reportRepository.save(report);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<SecurityReportDto> searchReports(
        UUID targetId,
        ReportType reportType,
        ReportStatus status,
        ReportFormat format,
        int page,
        int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SecurityReport> pageResult = reportRepository.searchReports(targetId, reportType, status, format, pageRequest);
        return PageResponse.from(pageResult.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public SecurityReportDto getReportById(UUID id) {
        SecurityReport report = reportRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
        return toDto(report);
    }

    @Transactional(readOnly = true)
    public ReportDownloadDto downloadReport(UUID id, String userEmail) {
        SecurityReport report = reportRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));

        if (report.getStatus() != ReportStatus.COMPLETED || report.getStorageReference() == null) {
            throw new IllegalStateException("Report is not ready for download. Current status: " + report.getStatus());
        }

        try {
            byte[] content = storageService.loadReport(report.getStorageReference());
            String ext = report.getFormat().name().toLowerCase();
            String filename = "aegis_report_" + report.getUuid().substring(0, 8) + "." + ext;
            String contentType = getContentType(report.getFormat());

            auditService.logEvent(
                null, userEmail != null ? userEmail : "SYSTEM",
                AuditEventType.REPORT_DOWNLOADED,
                "SECURITY_REPORT", report.getId().toString(),
                "DOWNLOAD_REPORT", "Downloaded report file: " + filename,
                null, null
            );

            return new ReportDownloadDto(
                report.getId().toString(),
                filename,
                contentType,
                content.length,
                report.getChecksum(),
                report.getFormat(),
                content,
                report.getCompletedAt() != null ? report.getCompletedAt() : report.getCreatedAt()
            );

        } catch (Exception e) {
            log.error("Error reading report file for download {}", id, e);
            throw new RuntimeException("Failed to load report content file", e);
        }
    }

    @Transactional
    public SecurityReportDto regenerateReport(UUID id, String userEmail) {
        SecurityReport report = reportRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));

        report.setStatus(ReportStatus.QUEUED);
        report.setErrorMessage(null);
        reportRepository.save(report);

        auditService.logEvent(
            null, userEmail != null ? userEmail : "SYSTEM",
            AuditEventType.REPORT_REGENERATED,
            "SECURITY_REPORT", id.toString(),
            "REGENERATE_REPORT", "Regenerating report: " + report.getTitle(),
            null, null
        );

        generateReportAsync(id);
        return toDto(report);
    }

    @Transactional
    public void deleteReport(UUID id, String userEmail) {
        SecurityReport report = reportRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));

        // Retention policy / Archive semantics
        report.setStatus(ReportStatus.EXPIRED);
        reportRepository.save(report);

        auditService.logEvent(
            null, userEmail != null ? userEmail : "SYSTEM",
            AuditEventType.RETENTION_ARCHIVE,
            "SECURITY_REPORT", id.toString(),
            "EXPIRE_REPORT", "Marked report status as EXPIRED per retention policy",
            null, null
        );
    }

    private String formatTitle(ReportType type, SecurityTarget target) {
        String targetName = target != null ? target.getName() : "All Targets";
        return type.name().replace('_', ' ') + " - " + targetName;
    }

    private String getContentType(ReportFormat format) {
        return switch (format) {
            case PDF -> "application/pdf";
            case HTML -> "text/html";
            case CSV -> "text/csv";
            case JSON -> "application/json";
        };
    }

    private String computeSha256(byte[] content) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(content);
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "";
        }
    }

    public SecurityReportDto toDto(SecurityReport r) {
        return new SecurityReportDto(
            r.getId().toString(),
            r.getUuid(),
            r.getReportType(),
            r.getTitle(),
            r.getTarget() != null ? r.getTarget().getId().toString() : null,
            r.getTarget() != null ? r.getTarget().getName() : "Global",
            r.getAssessment() != null ? r.getAssessment().getId().toString() : null,
            r.getIncident() != null ? r.getIncident().getId().toString() : null,
            r.getGeneratedBy(),
            r.getStatus(),
            r.getFormat(),
            r.getPeriodStart(),
            r.getPeriodEnd(),
            r.getChecksum(),
            r.getFileSize(),
            r.getErrorMessage(),
            r.getCreatedAt(),
            r.getCompletedAt()
        );
    }
}
