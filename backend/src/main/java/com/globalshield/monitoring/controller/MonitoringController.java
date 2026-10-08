package com.globalshield.monitoring.controller;

import com.globalshield.monitoring.dto.CreateMonitoringRequestDto;
import com.globalshield.monitoring.dto.MonitoringConfigurationDto;
import com.globalshield.monitoring.service.MonitoringService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private final MonitoringService monitoringService;

    @PostMapping
    public ResponseEntity<MonitoringConfigurationDto> createConfiguration(
        @Valid @RequestBody CreateMonitoringRequestDto dto,
        Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(monitoringService.createConfiguration(dto, userEmail));
    }

    @GetMapping
    public ResponseEntity<List<MonitoringConfigurationDto>> getAllConfigurations() {
        return ResponseEntity.ok(monitoringService.getAllConfigurations());
    }

    @GetMapping("/target/{targetId}")
    public ResponseEntity<MonitoringConfigurationDto> getConfigurationByTarget(@PathVariable("targetId") UUID targetId) {
        return ResponseEntity.ok(monitoringService.getConfigurationByTarget(targetId));
    }

    @PostMapping("/{id}/enable")
    public ResponseEntity<MonitoringConfigurationDto> enableConfiguration(
        @PathVariable("id") UUID id,
        Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(monitoringService.enableConfiguration(id, userEmail));
    }

    @PostMapping("/{id}/disable")
    public ResponseEntity<MonitoringConfigurationDto> disableConfiguration(
        @PathVariable("id") UUID id,
        Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(monitoringService.disableConfiguration(id, userEmail));
    }
}
