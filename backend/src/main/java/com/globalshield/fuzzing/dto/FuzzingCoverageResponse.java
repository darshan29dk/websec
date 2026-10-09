package com.globalshield.fuzzing.dto;

import com.globalshield.fuzzing.entity.CoverageStatus;
import com.globalshield.fuzzing.entity.FuzzingCoverageResult;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingCoverageResponse {

    private UUID id;
    private UUID campaignId;
    private String owaspCategory;
    private String categoryName;
    private Integer supportedChecksCount;
    private Integer executedChecksCount;
    private CoverageStatus status;
    private String limitationsNotes;
    private Instant testedAt;

    public static FuzzingCoverageResponse fromEntity(FuzzingCoverageResult r) {
        return FuzzingCoverageResponse.builder()
                .id(r.getId())
                .campaignId(r.getCampaign() != null ? r.getCampaign().getId() : null)
                .owaspCategory(r.getOwaspCategory())
                .categoryName(r.getCategoryName())
                .supportedChecksCount(r.getSupportedChecksCount())
                .executedChecksCount(r.getExecutedChecksCount())
                .status(r.getStatus())
                .limitationsNotes(r.getLimitationsNotes())
                .testedAt(r.getTestedAt())
                .build();
    }
}
