package com.aegis.forensics.repository;

import com.aegis.forensics.entity.NetworkForensicEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NetworkForensicEventRepository extends JpaRepository<NetworkForensicEvent, UUID> {
    Page<NetworkForensicEvent> findByForensicCaseId(UUID caseId, Pageable pageable);
}
