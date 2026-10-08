package com.globalshield.forensics.repository;

import com.globalshield.forensics.entity.ApplicationForensicEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ApplicationForensicEventRepository extends JpaRepository<ApplicationForensicEvent, UUID> {
    Page<ApplicationForensicEvent> findByForensicCaseId(UUID caseId, Pageable pageable);
}
