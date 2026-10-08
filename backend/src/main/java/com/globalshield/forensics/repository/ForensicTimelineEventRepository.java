package com.globalshield.forensics.repository;

import com.globalshield.forensics.entity.ForensicTimelineEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForensicTimelineEventRepository extends JpaRepository<ForensicTimelineEvent, UUID> {
    Page<ForensicTimelineEvent> findByForensicCaseIdOrderByEventTimeAscSequenceNumberAsc(UUID caseId, Pageable pageable);
    List<ForensicTimelineEvent> findByForensicCaseIdOrderByEventTimeAscSequenceNumberAsc(UUID caseId);
}
