package com.aegis.posture.repository;

import com.aegis.posture.entity.PostureDimensionType;
import com.aegis.posture.entity.SecurityPostureDimension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityPostureDimensionRepository extends JpaRepository<SecurityPostureDimension, UUID> {

    List<SecurityPostureDimension> findBySnapshotId(UUID snapshotId);

    Optional<SecurityPostureDimension> findBySnapshotIdAndDimension(UUID snapshotId, PostureDimensionType dimension);
}
