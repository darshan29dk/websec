package com.aegis.ai.repository;

import com.aegis.ai.entity.AiInvestigation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiInvestigationRepository extends JpaRepository<AiInvestigation, Long> {
    Optional<AiInvestigation> findByUuid(UUID uuid);
    List<AiInvestigation> findByAssessmentId(UUID assessmentId);
    List<AiInvestigation> findByIncidentId(UUID incidentId);
    List<AiInvestigation> findByStatus(String status);
}
