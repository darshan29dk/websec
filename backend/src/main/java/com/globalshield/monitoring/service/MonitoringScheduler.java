package com.globalshield.monitoring.service;

import com.globalshield.monitoring.entity.MonitoringConfiguration;
import com.globalshield.monitoring.repository.MonitoringConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringScheduler {

    private final MonitoringConfigurationRepository monitoringRepository;
    private final MonitoringService monitoringService;

    @Scheduled(fixedDelay = 60000) // Check due monitoring configurations every 60 seconds
    public void runScheduledMonitoringJobs() {
        Instant now = Instant.now();
        List<MonitoringConfiguration> due = monitoringRepository.findByEnabledTrueAndNextRunAtBefore(now);
        if (due.isEmpty()) {
            return;
        }

        log.info("Found {} due continuous monitoring configurations to process", due.size());
        for (MonitoringConfiguration config : due) {
            try {
                monitoringService.executeScheduledAssessment(config);
            } catch (Exception e) {
                log.error("Error executing scheduled monitoring configuration {}", config.getId(), e);
            }
        }
    }
}
