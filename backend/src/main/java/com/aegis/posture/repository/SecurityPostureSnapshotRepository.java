package com.aegis.posture.repository;

import com.aegis.posture.entity.SecurityPostureSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityPostureSnapshotRepository extends JpaRepository<SecurityPostureSnapshot, UUID> {

    Optional<SecurityPostureSnapshot> findByUuid(String uuid);

    Optional<SecurityPostureSnapshot> findTopByTargetIdOrderByCalculatedAtDesc(UUID targetId);

    Optional<SecurityPostureSnapshot> findByAssessmentId(UUID assessmentId);

    List<SecurityPostureSnapshot> findByTargetIdOrderByCalculatedAtDesc(UUID targetId);

    List<SecurityPostureSnapshot> findTop10ByTargetIdOrderByCalculatedAtDesc(UUID targetId);
}
