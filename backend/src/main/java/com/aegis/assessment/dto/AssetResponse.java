package com.aegis.assessment.dto;

import com.aegis.assessment.result.AssessmentAsset;
import com.aegis.assessment.result.AssetType;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AssetResponse {
    private UUID id;
    private UUID assessmentId;
    private AssetType assetType;
    private String value;
    private String source;
    private String confidence;
    private Instant createdAt;

    public static AssetResponse fromEntity(AssessmentAsset asset) {
        return AssetResponse.builder()
                .id(asset.getId())
                .assessmentId(asset.getAssessment() != null ? asset.getAssessment().getId() : null)
                .assetType(asset.getAssetType())
                .value(asset.getValue())
                .source(asset.getSource())
                .confidence(asset.getConfidence())
                .createdAt(asset.getCreatedAt())
                .build();
    }
}
