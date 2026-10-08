package com.globalshield.finding.repository;

import com.globalshield.finding.entity.FindingConfidence;
import com.globalshield.finding.entity.FindingSeverity;
import com.globalshield.finding.entity.FindingStatus;
import com.globalshield.finding.entity.SecurityFinding;
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
public interface SecurityFindingRepository extends JpaRepository<SecurityFinding, UUID> {

    List<SecurityFinding> findByAssessmentId(UUID assessmentId);

    Page<SecurityFinding> findByAssessmentId(UUID assessmentId, Pageable pageable);

    Optional<SecurityFinding> findByAssessmentIdAndDeduplicationHash(UUID assessmentId, String deduplicationHash);

    @Query("SELECT f FROM SecurityFinding f WHERE " +
           "(:assessmentId IS NULL OR f.assessment.id = :assessmentId) AND " +
           "(:severity IS NULL OR f.severity = :severity) AND " +
           "(:status IS NULL OR f.status = :status) AND " +
           "(:confidence IS NULL OR f.confidence = :confidence) AND " +
           "(:source IS NULL OR LOWER(f.source) LIKE LOWER(CONCAT('%', :source, '%'))) AND " +
           "(:search IS NULL OR LOWER(f.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(f.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<SecurityFinding> searchFindings(
            @Param("assessmentId") UUID assessmentId,
            @Param("severity") FindingSeverity severity,
            @Param("status") FindingStatus status,
            @Param("confidence") FindingConfidence confidence,
            @Param("source") String source,
            @Param("search") String search,
            Pageable pageable
    );

    long countByAssessmentId(UUID assessmentId);

    long countByAssessmentIdAndSeverity(UUID assessmentId, FindingSeverity severity);

    List<SecurityFinding> findByAssessmentTargetId(UUID targetId);

    List<SecurityFinding> findByAssessmentTargetIdAndStatus(UUID targetId, FindingStatus status);

    long countByAssessmentTargetIdAndSeverity(UUID targetId, FindingSeverity severity);
}

