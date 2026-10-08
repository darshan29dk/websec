package com.aegis.monitoring.dto;

import com.aegis.monitoring.entity.MonitoringFrequency;
import com.aegis.monitoring.entity.MonitoringStatus;

import java.time.Instant;

public record MonitoringConfigurationDto(
    String id,
    String uuid,
    String targetId,
    String targetName,
    String targetUrl,
    String profileId,
    String profileName,
    MonitoringFrequency frequency,
    boolean enabled,
    Instant nextRunAt,
    Instant lastRunAt,
    MonitoringStatus lastStatus,
    String createdBy,
    Instant createdAt,
    Instant updatedAt
) {}
