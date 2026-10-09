package com.globalshield.fuzzing.dto;

import com.globalshield.fuzzing.entity.FuzzingCampaign;
import com.globalshield.fuzzing.entity.FuzzingProfile;
import com.globalshield.fuzzing.entity.FuzzingStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingCampaignResponse {

    private UUID id;
    private UUID targetId;
    private String targetName;
    private String targetPrimaryUrl;
    private UUID assessmentId;
    private String name;
    private FuzzingProfile profile;
    private FuzzingStatus status;
    private String targetScopeSnapshot;
    private Integer rateLimitRps;
    private Integer maxRequests;
    private Integer timeoutMs;
    private Integer concurrency;
    private String categories;
    private Integer totalTestCases;
    private Integer executedTestCases;
    private Integer findingsCount;
    private Integer suspiciousCount;
    private Long durationMs;
    private String errorMessage;
    private String createdBy;
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;
    private Integer progressPercent;

    public static FuzzingCampaignResponse fromEntity(FuzzingCampaign c) {
        int progress = 0;
        if (c.getTotalTestCases() > 0) {
            progress = Math.min(100, (int) Math.round(((double) c.getExecutedTestCases() / c.getTotalTestCases()) * 100));
        } else if (c.getStatus() == FuzzingStatus.COMPLETED) {
            progress = 100;
        }

        return FuzzingCampaignResponse.builder()
                .id(c.getId())
                .targetId(c.getTarget() != null ? c.getTarget().getId() : null)
                .targetName(c.getTarget() != null ? c.getTarget().getName() : null)
                .targetPrimaryUrl(c.getTarget() != null ? c.getTarget().getPrimaryUrl() : null)
                .assessmentId(c.getAssessment() != null ? c.getAssessment().getId() : null)
                .name(c.getName())
                .profile(c.getProfile())
                .status(c.getStatus())
                .targetScopeSnapshot(c.getTargetScopeSnapshot())
                .rateLimitRps(c.getRateLimitRps())
                .maxRequests(c.getMaxRequests())
                .timeoutMs(c.getTimeoutMs())
                .concurrency(c.getConcurrency())
                .categories(c.getCategories())
                .totalTestCases(c.getTotalTestCases())
                .executedTestCases(c.getExecutedTestCases())
                .findingsCount(c.getFindingsCount())
                .suspiciousCount(c.getSuspiciousCount())
                .durationMs(c.getDurationMs())
                .errorMessage(c.getErrorMessage())
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .startedAt(c.getStartedAt())
                .completedAt(c.getCompletedAt())
                .progressPercent(progress)
                .build();
    }
}
