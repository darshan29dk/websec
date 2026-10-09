package com.globalshield.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalDashboardChartsDto {

    @Builder.Default
    private List<RiskDistributionItem> riskDistribution = new ArrayList<>();

    @Builder.Default
    private List<SeverityDistributionItem> findingsBySeverity = new ArrayList<>();

    @Builder.Default
    private List<HighestRiskWebsiteItem> highestRiskWebsites = new ArrayList<>();

    @Builder.Default
    private List<TimelineTrendItem> findingsTimeline = new ArrayList<>();

    @Builder.Default
    private List<StatusCountItem> assessmentStatuses = new ArrayList<>();

    @Builder.Default
    private List<StatusCountItem> remediationRetestOutcomes = new ArrayList<>();

    @Builder.Default
    private List<PostureTrendItem> postureTrends = new ArrayList<>();

    @Builder.Default
    private List<RecentSecurityActivityItem> recentSecurityActivity = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskDistributionItem {
        private String category; // CRITICAL, HIGH, MEDIUM, LOW, NOT_ASSESSED
        private long count;
        private double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeverityDistributionItem {
        private String severity;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HighestRiskWebsiteItem {
        private UUID targetId;
        private String name;
        private String primaryUrl;
        private String riskCategory;
        private Integer riskScore;
        private long openCriticalFindings;
        private long openHighFindings;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineTrendItem {
        private String period; // e.g., 'Oct 2026', 'Nov 2026'
        private long discovered;
        private long resolved;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCountItem {
        private String status;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostureTrendItem {
        private String label;
        private int score;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentSecurityActivityItem {
        private String eventType;
        private String description;
        private String targetName;
        private String timestamp;
    }
}
