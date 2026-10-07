package com.aegis.retest.repository;

import com.aegis.retest.entity.RemediationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RemediationStatusHistoryRepository extends JpaRepository<RemediationStatusHistory, UUID> {
    Optional<RemediationStatusHistory> findByUuid(String uuid);
    List<RemediationStatusHistory> findByFindingIdOrderByCreatedAtDesc(UUID findingId);
}
