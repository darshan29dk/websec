package com.globalshield.ai.repository;

import com.globalshield.ai.entity.AiEvidenceReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiEvidenceReferenceRepository extends JpaRepository<AiEvidenceReference, Long> {
    List<AiEvidenceReference> findByInvestigationId(Long investigationId);
}
