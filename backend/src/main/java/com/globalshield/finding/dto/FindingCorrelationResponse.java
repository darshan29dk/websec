package com.globalshield.finding.dto;

import com.globalshield.finding.entity.CorrelationType;
import com.globalshield.finding.entity.FindingCorrelation;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FindingCorrelationResponse {
    private UUID id;
    private UUID findingId;
    private UUID relatedFindingId;
    private String relatedFindingTitle;
    private CorrelationType correlationType;
    private String confidence;
    private String reason;
    private Instant createdAt;

    public static FindingCorrelationResponse fromEntity(FindingCorrelation entity) {
        return FindingCorrelationResponse.builder()
                .id(entity.getId())
                .findingId(entity.getFinding() != null ? entity.getFinding().getId() : null)
                .relatedFindingId(entity.getRelatedFinding() != null ? entity.getRelatedFinding().getId() : null)
                .relatedFindingTitle(entity.getRelatedFinding() != null ? entity.getRelatedFinding().getTitle() : null)
                .correlationType(entity.getCorrelationType())
                .confidence(entity.getConfidence())
                .reason(entity.getReason())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
