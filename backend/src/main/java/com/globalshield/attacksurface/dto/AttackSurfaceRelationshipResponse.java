package com.globalshield.attacksurface.dto;

import com.globalshield.attacksurface.entity.AttackSurfaceRelationship;
import com.globalshield.attacksurface.entity.RelationshipType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AttackSurfaceRelationshipResponse {
    private UUID id;
    private String uuid;
    private UUID assessmentId;
    private UUID sourceAssetId;
    private String sourceAssetValue;
    private RelationshipType relationshipType;
    private UUID targetAssetId;
    private String targetAssetValue;
    private String confidence;
    private String source;
    private Instant createdAt;

    public static AttackSurfaceRelationshipResponse fromEntity(AttackSurfaceRelationship entity) {
        return AttackSurfaceRelationshipResponse.builder()
                .id(entity.getId())
                .uuid(entity.getUuid())
                .assessmentId(entity.getAssessment() != null ? entity.getAssessment().getId() : null)
                .sourceAssetId(entity.getSourceAsset() != null ? entity.getSourceAsset().getId() : null)
                .sourceAssetValue(entity.getSourceAsset() != null ? entity.getSourceAsset().getAssetValue() : null)
                .relationshipType(entity.getRelationshipType())
                .targetAssetId(entity.getTargetAsset() != null ? entity.getTargetAsset().getId() : null)
                .targetAssetValue(entity.getTargetAsset() != null ? entity.getTargetAsset().getAssetValue() : null)
                .confidence(entity.getConfidence())
                .source(entity.getSource())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
