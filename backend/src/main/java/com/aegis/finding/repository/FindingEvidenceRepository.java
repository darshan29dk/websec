package com.aegis.finding.repository;

import com.aegis.finding.entity.FindingEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FindingEvidenceRepository extends JpaRepository<FindingEvidence, UUID> {

    List<FindingEvidence> findByFindingId(UUID findingId);
}
