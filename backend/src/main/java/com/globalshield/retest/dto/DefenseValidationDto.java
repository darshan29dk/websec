package com.globalshield.retest.dto;

import com.globalshield.retest.entity.DefenseValidation;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class DefenseValidationDto {
    private String id;
    private String uuid;
    private String findingId;
    private String retestId;
    private String validationStatus;
    private String confidence;
    private String summary;
    private String validatedBy;
    private OffsetDateTime validatedAt;
    private OffsetDateTime createdAt;
    private List<ValidationResultDto> results;

    public static DefenseValidationDto fromEntity(DefenseValidation dv, List<ValidationResultDto> results) {
        if (dv == null) return null;
        return DefenseValidationDto.builder()
                .id(dv.getId() != null ? dv.getId().toString() : null)
                .uuid(dv.getUuid())
                .findingId(dv.getFinding() != null && dv.getFinding().getId() != null ? dv.getFinding().getId().toString() : null)
                .retestId(dv.getRetest() != null && dv.getRetest().getId() != null ? dv.getRetest().getId().toString() : null)
                .validationStatus(dv.getValidationStatus() != null ? dv.getValidationStatus().name() : null)
                .confidence(dv.getConfidence() != null ? dv.getConfidence().name() : null)
                .summary(dv.getSummary())
                .validatedBy(dv.getValidatedBy())
                .validatedAt(dv.getValidatedAt())
                .createdAt(dv.getCreatedAt())
                .results(results)
                .build();
    }
}
