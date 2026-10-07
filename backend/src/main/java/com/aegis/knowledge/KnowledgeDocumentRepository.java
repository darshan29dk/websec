package com.aegis.knowledge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Long> {
    Optional<KnowledgeDocument> findByUuid(UUID uuid);
    Optional<KnowledgeDocument> findByContentHash(String contentHash);
    List<KnowledgeDocument> findByStatus(String status);
    List<KnowledgeDocument> findBySource(String source);
}
