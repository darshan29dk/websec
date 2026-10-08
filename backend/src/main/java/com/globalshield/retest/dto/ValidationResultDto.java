package com.globalshield.retest.dto;

import com.globalshield.retest.entity.ValidationResult;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class ValidationResultDto {
    private String id;
    private String uuid;
    private String checkId;
    private String resultType;
    private String expectedValue;
    private String observedValue;
    private String comparisonResult;
    private String confidence;
    private String evidenceReference;
    private OffsetDateTime createdAt;

    public static ValidationResultDto fromEntity(ValidationResult vr) {
        if (vr == null) return null;
        return ValidationResultDto.builder()
                .id(vr.getId() != null ? vr.getId().toString() : null)
                .uuid(vr.getUuid())
                .checkId(vr.getCheck() != null && vr.getCheck().getId() != null ? vr.getCheck().getId().toString() : null)
                .resultType(vr.getResultType() != null ? vr.getResultType().name() : null)
                .expectedValue(vr.getExpectedValue())
                .observedValue(vr.getObservedValue())
                .comparisonResult(vr.getComparisonResult())
                .confidence(vr.getConfidence() != null ? vr.getConfidence().name() : null)
                .evidenceReference(vr.getEvidenceReference())
                .createdAt(vr.getCreatedAt())
                .build();
    }
}
