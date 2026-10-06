package com.aegis.finding.dto;

import com.aegis.finding.entity.FindingReference;
import com.aegis.finding.entity.ReferenceType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FindingReferenceResponse {
    private UUID id;
    private UUID findingId;
    private ReferenceType referenceType;
    private String referenceId;
    private String url;
    private String title;
    private String source;
    private Instant createdAt;

    public static FindingReferenceResponse fromEntity(FindingReference entity) {
        return FindingReferenceResponse.builder()
                .id(entity.getId())
                .findingId(entity.getFinding() != null ? entity.getFinding().getId() : null)
                .referenceType(entity.getReferenceType())
                .referenceId(entity.getReferenceId())
                .url(entity.getUrl())
                .title(entity.getTitle())
                .source(entity.getSource())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
