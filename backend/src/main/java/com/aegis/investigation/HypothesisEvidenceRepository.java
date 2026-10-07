package com.aegis.investigation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HypothesisEvidenceRepository extends JpaRepository<HypothesisEvidence, HypothesisEvidenceKey> {
    List<HypothesisEvidence> findByIdHypothesisId(UUID hypothesisId);
    List<HypothesisEvidence> findByIdEvidenceId(UUID evidenceId);
}
