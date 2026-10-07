package com.aegis.forensics.repository;

import com.aegis.forensics.entity.ForensicCase;
import com.aegis.forensics.enums.CaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ForensicCaseRepository extends JpaRepository<ForensicCase, UUID> {

    Optional<ForensicCase> findByUuid(String uuid);

    Optional<ForensicCase> findByCaseNumber(String caseNumber);

    @Query("SELECT fc FROM ForensicCase fc WHERE " +
           "(:targetId IS NULL OR fc.target.id = :targetId) AND " +
           "(:status IS NULL OR fc.status = :status)")
    Page<ForensicCase> findCases(@Param("targetId") UUID targetId,
                                 @Param("status") CaseStatus status,
                                 Pageable pageable);
}
