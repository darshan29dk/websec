package com.aegis.assessment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SecurityAssessmentRepository extends JpaRepository<SecurityAssessment, UUID> {

    @Query("SELECT a FROM SecurityAssessment a WHERE " +
           "(:targetId IS NULL OR a.target.id = :targetId) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<SecurityAssessment> searchAssessments(
            @Param("targetId") UUID targetId,
            @Param("status") AssessmentStatus status,
            Pageable pageable
    );

    long countByStatus(AssessmentStatus status);

    java.util.List<SecurityAssessment> findByTargetIdOrderByCreatedAtDesc(UUID targetId);

    java.util.List<SecurityAssessment> findTop2ByTargetIdAndStatusOrderByCompletedAtDesc(UUID targetId, AssessmentStatus status);
}

