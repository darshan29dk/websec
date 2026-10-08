package com.globalshield.ai.repository;

import com.globalshield.ai.entity.AiKnowledgeReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiKnowledgeReferenceRepository extends JpaRepository<AiKnowledgeReference, Long> {
    List<AiKnowledgeReference> findByInvestigationId(Long investigationId);
}
