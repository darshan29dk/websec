package com.globalshield.monitoring.dto;

import com.globalshield.monitoring.entity.MonitoringFrequency;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateMonitoringRequestDto(
    @NotNull UUID targetId,
    UUID profileId,
    @NotNull MonitoringFrequency frequency
) {}
