package com.aegis.defense.repository;

import com.aegis.defense.entity.DefenseEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DefenseEvidenceRepository extends JpaRepository<DefenseEvidence, UUID> {
    Optional<DefenseEvidence> findByUuid(UUID uuid);
    List<DefenseEvidence> findByRecommendationId(UUID recommendationId);
}
