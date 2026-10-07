package com.aegis.retest.repository;

import com.aegis.retest.entity.Retest;
import com.aegis.retest.entity.RetestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RetestRepository extends JpaRepository<Retest, UUID> {
    Optional<Retest> findByUuid(String uuid);
    List<Retest> findByFindingIdOrderByCreatedAtDesc(UUID findingId);
    List<Retest> findByAssessmentIdOrderByCreatedAtDesc(UUID assessmentId);
    List<Retest> findByTargetIdOrderByCreatedAtDesc(UUID targetId);
    List<Retest> findByFindingIdAndStatusIn(UUID findingId, List<RetestStatus> statuses);
    long countByStatus(RetestStatus status);
}
