package com.aegis.defense.repository;

import com.aegis.defense.entity.DefenseValidationPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DefenseValidationPlanRepository extends JpaRepository<DefenseValidationPlan, UUID> {
    Optional<DefenseValidationPlan> findByUuid(UUID uuid);
    Optional<DefenseValidationPlan> findByRecommendationId(UUID recommendationId);
}
