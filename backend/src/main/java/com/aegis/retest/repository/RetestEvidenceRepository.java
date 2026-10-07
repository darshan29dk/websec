package com.aegis.retest.repository;

import com.aegis.retest.entity.RetestEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RetestEvidenceRepository extends JpaRepository<RetestEvidence, UUID> {
    Optional<RetestEvidence> findByUuid(String uuid);
    List<RetestEvidence> findByRetestIdOrderByCreatedAtAsc(UUID retestId);
    List<RetestEvidence> findByCheckIdOrderByCreatedAtAsc(UUID checkId);
}
