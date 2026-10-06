package com.aegis.finding.dto;

import com.aegis.finding.entity.EvidenceType;
import com.aegis.finding.entity.FindingEvidence;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FindingEvidenceResponse {
    private UUID id;
    private String uuid;
    private UUID findingId;
    private EvidenceType evidenceType;
    private String source;
    private String content;
    private String redactedContent;
    private String location;
    private Instant observedAt;
    private String hash;

    public static FindingEvidenceResponse fromEntity(FindingEvidence entity) {
        return FindingEvidenceResponse.builder()
                .id(entity.getId())
                .uuid(entity.getUuid())
                .findingId(entity.getFinding() != null ? entity.getFinding().getId() : null)
                .evidenceType(entity.getEvidenceType())
                .source(entity.getSource())
                .content(entity.getContent())
                .redactedContent(entity.getRedactedContent())
                .location(entity.getLocation())
                .observedAt(entity.getObservedAt())
                .hash(entity.getHash())
                .build();
    }
}
