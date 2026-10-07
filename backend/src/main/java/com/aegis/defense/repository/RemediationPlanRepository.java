package com.aegis.defense.repository;

import com.aegis.defense.entity.RemediationPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RemediationPlanRepository extends JpaRepository<RemediationPlan, UUID> {
    Optional<RemediationPlan> findByUuid(UUID uuid);
    List<RemediationPlan> findByFindingId(UUID findingId);
    List<RemediationPlan> findByRecommendationId(UUID recommendationId);
    List<RemediationPlan> findByStatus(String status);
}
