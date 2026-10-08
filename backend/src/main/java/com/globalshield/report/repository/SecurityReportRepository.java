package com.globalshield.report.repository;

import com.globalshield.report.entity.ReportFormat;
import com.globalshield.report.entity.ReportStatus;
import com.globalshield.report.entity.ReportType;
import com.globalshield.report.entity.SecurityReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityReportRepository extends JpaRepository<SecurityReport, UUID> {

    Optional<SecurityReport> findByUuid(String uuid);

    List<SecurityReport> findByTargetIdOrderByCreatedAtDesc(UUID targetId);

    @Query("SELECT r FROM SecurityReport r WHERE " +
           "(:targetId IS NULL OR r.target.id = :targetId) AND " +
           "(:reportType IS NULL OR r.reportType = :reportType) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:format IS NULL OR r.format = :format)")
    Page<SecurityReport> searchReports(
            @Param("targetId") UUID targetId,
            @Param("reportType") ReportType reportType,
            @Param("status") ReportStatus status,
            @Param("format") ReportFormat format,
            Pageable pageable
    );
}
