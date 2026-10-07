package com.aegis.defense.repository;

import com.aegis.defense.entity.DefenseRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DefenseRecommendationRepository extends JpaRepository<DefenseRecommendation, UUID> {
    Optional<DefenseRecommendation> findByUuid(UUID uuid);
    List<DefenseRecommendation> findByFindingId(UUID findingId);
    List<DefenseRecommendation> findByStatus(String status);
    List<DefenseRecommendation> findByPriority(String priority);
}
