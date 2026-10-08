package com.globalshield.retest.dto;

import com.globalshield.retest.entity.RetestEvidence;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class RetestEvidenceDto {
    private String id;
    private String uuid;
    private String checkId;
    private String source;
    private String evidenceType;
    private String contentHash;
    private String evidenceData;
    private OffsetDateTime createdAt;

    public static RetestEvidenceDto fromEntity(RetestEvidence ev) {
        if (ev == null) return null;
        return RetestEvidenceDto.builder()
                .id(ev.getId() != null ? ev.getId().toString() : null)
                .uuid(ev.getUuid())
                .checkId(ev.getCheck() != null && ev.getCheck().getId() != null ? ev.getCheck().getId().toString() : null)
                .source(ev.getSource())
                .evidenceType(ev.getEvidenceType())
                .contentHash(ev.getContentHash())
                .evidenceData(ev.getEvidenceData())
                .createdAt(ev.getCreatedAt())
                .build();
    }
}
