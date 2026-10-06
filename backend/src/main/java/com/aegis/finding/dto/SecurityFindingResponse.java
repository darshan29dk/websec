package com.aegis.finding.dto;

import com.aegis.finding.entity.*;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class SecurityFindingResponse {
    private UUID id;
    private String uuid;
    private UUID assessmentId;
    private UUID assetId;
    private String assetValue;
    private UUID endpointId;
    private String endpointUrl;
    private String title;
    private String description;
    private FindingType findingType;
    private FindingSeverity severity;
    private String originalSeverity;
    private FindingConfidence confidence;
    private FindingStatus status;
    private String source;
    private String deduplicationHash;
    private Instant firstSeenAt;
    private Instant lastSeenAt;
    private Instant createdAt;

    public static SecurityFindingResponse fromEntity(SecurityFinding entity) {
        return SecurityFindingResponse.builder()
                .id(entity.getId())
                .uuid(entity.getUuid())
                .assessmentId(entity.getAssessment() != null ? entity.getAssessment().getId() : null)
                .assetId(entity.getAsset() != null ? entity.getAsset().getId() : null)
                .assetValue(entity.getAsset() != null ? entity.getAsset().getAssetValue() : null)
                .endpointId(entity.getEndpoint() != null ? entity.getEndpoint().getId() : null)
                .endpointUrl(entity.getEndpoint() != null ? entity.getEndpoint().getUrl() : null)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .findingType(entity.getFindingType())
                .severity(entity.getSeverity())
                .originalSeverity(entity.getOriginalSeverity())
                .confidence(entity.getConfidence())
                .status(entity.getStatus())
                .source(entity.getSource())
                .deduplicationHash(entity.getDeduplicationHash())
                .firstSeenAt(entity.getFirstSeenAt())
                .lastSeenAt(entity.getLastSeenAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
