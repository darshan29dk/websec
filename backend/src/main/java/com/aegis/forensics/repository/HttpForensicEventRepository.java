package com.aegis.forensics.repository;

import com.aegis.forensics.entity.HttpForensicEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HttpForensicEventRepository extends JpaRepository<HttpForensicEvent, UUID> {
    Page<HttpForensicEvent> findByForensicCaseId(UUID caseId, Pageable pageable);
}
