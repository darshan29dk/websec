package com.globalshield.posture.repository;

import com.globalshield.posture.entity.PostureDimensionType;
import com.globalshield.posture.entity.PostureScoreFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostureScoreFactorRepository extends JpaRepository<PostureScoreFactor, UUID> {

    List<PostureScoreFactor> findBySnapshotId(UUID snapshotId);

    List<PostureScoreFactor> findBySnapshotIdAndDimension(UUID snapshotId, PostureDimensionType dimension);
}
