package com.aegis.forensics.repository;

import com.aegis.forensics.entity.EvidenceProvenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvidenceProvenanceRepository extends JpaRepository<EvidenceProvenance, UUID> {
    List<EvidenceProvenance> findByEvidenceId(UUID evidenceId);
}
