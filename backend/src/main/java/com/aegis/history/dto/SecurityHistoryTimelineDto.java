package com.aegis.history.dto;

import java.time.Instant;
import java.util.List;

public record SecurityHistoryTimelineDto(
    String targetId,
    String targetName,
    String primaryUrl,
    int currentScore,
    String currentRiskLevel,
    List<TimelineEventItem> events
) {
    public record TimelineEventItem(
        String eventId,
        String category, // ASSESSMENT, FINDING_CHANGE, RETEST, DEFENSE_VALIDATION, REGRESSION, MONITORING, INCIDENT
        String title,
        String summary,
        String severity,
        Instant timestamp,
        String resourceType,
        String resourceId
    ) {}
}
