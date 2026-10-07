package com.aegis.ai.repository;

import com.aegis.ai.entity.AiAnalysisClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiAnalysisClaimRepository extends JpaRepository<AiAnalysisClaim, Long> {
    Optional<AiAnalysisClaim> findByUuid(UUID uuid);
    List<AiAnalysisClaim> findByInvestigationId(Long investigationId);
}
