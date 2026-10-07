package com.aegis.forensics.repository;

import com.aegis.forensics.entity.ForensicAttackEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForensicAttackEventRepository extends JpaRepository<ForensicAttackEvent, UUID> {
    List<ForensicAttackEvent> findByForensicCaseIdOrderByEventTimeAsc(UUID caseId);
}
