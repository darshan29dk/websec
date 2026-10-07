package com.aegis.forensics.repository;

import com.aegis.forensics.entity.ForensicEvidence;
import com.aegis.forensics.enums.EvidenceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ForensicEvidenceRepository extends JpaRepository<ForensicEvidence, UUID> {
    Optional<ForensicEvidence> findByUuid(String uuid);
    Page<ForensicEvidence> findByForensicCaseId(UUID caseId, Pageable pageable);
    List<ForensicEvidence> findByForensicCaseIdOrderByCollectionTimeDesc(UUID caseId);
    Page<ForensicEvidence> findByForensicCaseIdAndEvidenceType(UUID caseId, EvidenceType evidenceType, Pageable pageable);
}
