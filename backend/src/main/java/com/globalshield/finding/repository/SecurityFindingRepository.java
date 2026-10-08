package com.globalshield.finding.repository;

import com.globalshield.finding.entity.FindingConfidence;
import com.globalshield.finding.entity.FindingSeverity;
import com.globalshield.finding.entity.FindingStatus;
import com.globalshield.finding.entity.SecurityFinding;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityFindingRepository extends JpaRepository<SecurityFinding, UUID>, JpaSpecificationExecutor<SecurityFinding> {

    List<SecurityFinding> findByAssessmentId(UUID assessmentId);

    Page<SecurityFinding> findByAssessmentId(UUID assessmentId, Pageable pageable);

    Optional<SecurityFinding> findByAssessmentIdAndDeduplicationHash(UUID assessmentId, String deduplicationHash);

    long countByAssessmentId(UUID assessmentId);

    long countByAssessmentIdAndSeverity(UUID assessmentId, FindingSeverity severity);

    List<SecurityFinding> findByAssessmentTargetId(UUID targetId);

    List<SecurityFinding> findByAssessmentTargetIdAndStatus(UUID targetId, FindingStatus status);

    long countByAssessmentTargetIdAndSeverity(UUID targetId, FindingSeverity severity);
}
