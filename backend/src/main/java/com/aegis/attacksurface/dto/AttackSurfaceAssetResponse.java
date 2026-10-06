package com.aegis.attacksurface.dto;

import com.aegis.attacksurface.entity.AssetStatus;
import com.aegis.attacksurface.entity.AssetType;
import com.aegis.attacksurface.entity.AttackSurfaceAsset;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AttackSurfaceAssetResponse {
    private UUID id;
    private String uuid;
    private UUID assessmentId;
    private AssetType assetType;
    private String assetValue;
    private String normalizedValue;
    private UUID parentAssetId;
    private AssetStatus status;
    private String confidence;
    private String source;
    private Instant firstSeenAt;
    private Instant lastSeenAt;

    public static AttackSurfaceAssetResponse fromEntity(AttackSurfaceAsset entity) {
        return AttackSurfaceAssetResponse.builder()
                .id(entity.getId())
                .uuid(entity.getUuid())
                .assessmentId(entity.getAssessment() != null ? entity.getAssessment().getId() : null)
                .assetType(entity.getAssetType())
                .assetValue(entity.getAssetValue())
                .normalizedValue(entity.getNormalizedValue())
                .parentAssetId(entity.getParentAsset() != null ? entity.getParentAsset().getId() : null)
                .status(entity.getStatus())
                .confidence(entity.getConfidence())
                .source(entity.getSource())
                .firstSeenAt(entity.getFirstSeenAt())
                .lastSeenAt(entity.getLastSeenAt())
                .build();
    }
}
