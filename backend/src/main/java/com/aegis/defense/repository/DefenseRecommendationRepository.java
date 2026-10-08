package com.aegis.defense.repository;

import com.aegis.defense.entity.DefenseRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DefenseRecommendationRepository extends JpaRepository<DefenseRecommendation, UUID> {
    Optional<DefenseRecommendation> findByUuid(UUID uuid);
    List<DefenseRecommendation> findByFindingId(UUID findingId);
    
    @Query("SELECT r FROM DefenseRecommendation r WHERE r.findingId IN (SELECT f.id FROM SecurityFinding f WHERE f.assessment.target.id = :targetId)")
    List<DefenseRecommendation> findByFindingAssessmentTargetId(@Param("targetId") UUID targetId);
    
    List<DefenseRecommendation> findByStatus(String status);
    List<DefenseRecommendation> findByPriority(String priority);
}
