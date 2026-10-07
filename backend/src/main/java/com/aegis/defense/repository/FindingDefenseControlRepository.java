package com.aegis.defense.repository;

import com.aegis.defense.entity.FindingDefenseControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FindingDefenseControlRepository extends JpaRepository<FindingDefenseControl, UUID> {
    List<FindingDefenseControl> findByFindingId(UUID findingId);
    List<FindingDefenseControl> findByControlId(UUID controlId);
}
