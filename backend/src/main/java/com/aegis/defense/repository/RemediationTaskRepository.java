package com.aegis.defense.repository;

import com.aegis.defense.entity.RemediationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RemediationTaskRepository extends JpaRepository<RemediationTask, UUID> {
    Optional<RemediationTask> findByUuid(UUID uuid);
    List<RemediationTask> findByPlanIdOrderBySequenceAsc(UUID planId);
}
