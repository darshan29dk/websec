package com.aegis.monitoring.dto;

import com.aegis.monitoring.entity.MonitoringFrequency;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateMonitoringRequestDto(
    @NotNull UUID targetId,
    UUID profileId,
    @NotNull MonitoringFrequency frequency
) {}
