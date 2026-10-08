package com.globalshield.attacksurface.repository;

import com.globalshield.attacksurface.entity.AssetType;
import com.globalshield.attacksurface.entity.AttackSurfaceAsset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttackSurfaceAssetRepository extends JpaRepository<AttackSurfaceAsset, UUID> {

    List<AttackSurfaceAsset> findByAssessmentId(UUID assessmentId);

    Page<AttackSurfaceAsset> findByAssessmentId(UUID assessmentId, Pageable pageable);

    Page<AttackSurfaceAsset> findByAssessmentIdAndAssetType(UUID assessmentId, AssetType assetType, Pageable pageable);

    Optional<AttackSurfaceAsset> findByAssessmentIdAndAssetTypeAndNormalizedValue(UUID assessmentId, AssetType assetType, String normalizedValue);

    long countByAssessmentId(UUID assessmentId);

    long countByAssessmentTargetId(UUID targetId);

    List<AttackSurfaceAsset> findByAssessmentTargetId(UUID targetId);
}

