package com.aegis.investigation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvestigationNoteRepository extends JpaRepository<InvestigationNote, UUID> {
    List<InvestigationNote> findByInvestigationIdOrderByCreatedAtAsc(UUID investigationId);
}
