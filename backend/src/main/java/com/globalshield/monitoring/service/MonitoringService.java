package com.globalshield.monitoring.service;

import com.globalshield.assessment.AssessmentProfile;
import com.globalshield.assessment.AssessmentProfileRepository;
import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.assessment.orchestrator.AssessmentOrchestrator;
import com.globalshield.audit.AuditEventType;
import com.globalshield.audit.AuditService;
import com.globalshield.monitoring.dto.CreateMonitoringRequestDto;
import com.globalshield.monitoring.dto.MonitoringConfigurationDto;
import com.globalshield.monitoring.entity.MonitoringConfiguration;
import com.globalshield.monitoring.entity.MonitoringFrequency;
import com.globalshield.monitoring.entity.MonitoringStatus;
import com.globalshield.monitoring.repository.MonitoringConfigurationRepository;
import com.globalshield.notification.entity.NotificationSeverity;
import com.globalshield.notification.entity.NotificationType;
import com.globalshield.notification.service.NotificationService;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import com.globalshield.target.TargetStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringService {

    private final MonitoringConfigurationRepository monitoringRepository;
    private final SecurityTargetRepository targetRepository;
    private final AssessmentProfileRepository profileRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final AssessmentOrchestrator assessmentOrchestrator;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional
    public MonitoringConfigurationDto createConfiguration(CreateMonitoringRequestDto dto, String createdBy) {
        SecurityTarget target = targetRepository.findById(dto.targetId())
            .orElseThrow(() -> new IllegalArgumentException("Target not found: " + dto.targetId()));

        AssessmentProfile profile = dto.profileId() != null
            ? profileRepository.findById(dto.profileId()).orElse(null)
            : profileRepository.findAll().stream().findFirst().orElse(null);

        MonitoringConfiguration config = MonitoringConfiguration.builder()
            .target(target)
            .profile(profile)
            .frequency(dto.frequency())
            .enabled(true)
            .nextRunAt(calculateNextRun(Instant.now(), dto.frequency()))
            .lastStatus(MonitoringStatus.IDLE)
            .createdBy(createdBy != null ? createdBy : "SYSTEM")
            .createdAt(Instant.now())
            .build();

        config = monitoringRepository.save(config);

        auditService.logEvent(
            null,
            createdBy != null ? createdBy : "SYSTEM",
            AuditEventType.MONITORING_CREATED,
            "TARGET",
            target.getId().toString(),
            "CREATE_MONITORING",
            "Created monitoring configuration for target " + target.getName() + " with frequency " + dto.frequency(),
            null,
            null
        );

        return toDto(config);
    }

    @Transactional
    public MonitoringConfigurationDto enableConfiguration(UUID id, String userEmail) {
        MonitoringConfiguration config = monitoringRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Monitoring configuration not found: " + id));
        config.setEnabled(true);
        config.setNextRunAt(calculateNextRun(Instant.now(), config.getFrequency()));
        config = monitoringRepository.save(config);

        auditService.logEvent(
            null, userEmail != null ? userEmail : "SYSTEM",
            AuditEventType.MONITORING_ENABLED,
            "MONITORING_CONFIGURATION", id.toString(),
            "ENABLE_MONITORING", "Enabled monitoring schedule for target " + config.getTarget().getName(),
            null, null
        );

        return toDto(config);
    }

    @Transactional
    public MonitoringConfigurationDto disableConfiguration(UUID id, String userEmail) {
        MonitoringConfiguration config = monitoringRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Monitoring configuration not found: " + id));
        config.setEnabled(false);
        config = monitoringRepository.save(config);

        auditService.logEvent(
            null, userEmail != null ? userEmail : "SYSTEM",
            AuditEventType.MONITORING_DISABLED,
            "MONITORING_CONFIGURATION", id.toString(),
            "DISABLE_MONITORING", "Disabled monitoring schedule for target " + config.getTarget().getName(),
            null, null
        );

        return toDto(config);
    }

    @Transactional(readOnly = true)
    public List<MonitoringConfigurationDto> getAllConfigurations() {
        return monitoringRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MonitoringConfigurationDto getConfigurationByTarget(UUID targetId) {
        MonitoringConfiguration config = monitoringRepository.findByTargetId(targetId)
            .orElseThrow(() -> new IllegalArgumentException("No monitoring configuration for target: " + targetId));
        return toDto(config);
    }

    @Transactional
    public void executeScheduledAssessment(MonitoringConfiguration config) {
        SecurityTarget target = config.getTarget();
        log.info("Evaluating scheduled monitoring execution for target {}", target.getName());

        // 1. AUTHORIZATION & SCOPE SAFETY CHECK
        if (target.getStatus() != TargetStatus.ACTIVE) {
            blockMonitoring(config, "Target is not ACTIVE (status: " + target.getStatus() + ")");
            return;
        }

        if (target.getAuthorizations() == null || target.getAuthorizations().isEmpty()) {
            blockMonitoring(config, "Target has no valid authorizations registered");
            return;
        }

        boolean hasValidAuth = target.getAuthorizations().stream().anyMatch(auth -> auth.isValid());
        if (!hasValidAuth) {
            blockMonitoring(config, "Target authorization has expired or is invalid");
            return;
        }

        // 2. AUTHORIZATION IS VALID -> Create & trigger assessment
        try {
            SecurityAssessment assessment = SecurityAssessment.builder()
                .target(target)
                .profile(config.getProfile())
                .status(AssessmentStatus.QUEUED)
                .requestedBy(target.getCreatedBy())
                .authorizationConfirmed(true)
                .progressPercent(0)
                .queuedAt(Instant.now())
                .build();

            assessment = assessmentRepository.save(assessment);

            assessmentOrchestrator.executeAssessmentAsync(
                assessment.getId(),
                target.getCreatedBy() != null ? target.getCreatedBy().getId() : null,
                config.getCreatedBy()
            );

            config.setLastRunAt(Instant.now());
            config.setNextRunAt(calculateNextRun(Instant.now(), config.getFrequency()));
            config.setLastStatus(MonitoringStatus.SUCCESS);
            monitoringRepository.save(config);

            auditService.logEvent(
                null, config.getCreatedBy(),
                AuditEventType.MONITORING_EXECUTED,
                "MONITORING_CONFIGURATION", config.getId().toString(),
                "EXECUTE_MONITORING", "Launched scheduled assessment for target " + target.getName(),
                null, null
            );

        } catch (Exception e) {
            log.error("Failed to execute scheduled assessment for target {}", target.getName(), e);
            config.setLastStatus(MonitoringStatus.FAILED);
            monitoringRepository.save(config);

            notificationService.createNotification(
                config.getCreatedBy(),
                NotificationType.MONITORING_FAILURE,
                NotificationSeverity.HIGH,
                "Scheduled Assessment Failed",
                "Continuous monitoring assessment execution failed for target " + target.getName() + ": " + e.getMessage(),
                "TARGET",
                target.getId().toString()
            );
        }
    }

    private void blockMonitoring(MonitoringConfiguration config, String reason) {
        log.warn("BLOCKED scheduled monitoring for target {}: {}", config.getTarget().getName(), reason);
        config.setLastStatus(MonitoringStatus.BLOCKED_AUTHORIZATION_EXPIRED);
        config.setEnabled(false); // Auto-disable expired monitoring
        monitoringRepository.save(config);

        notificationService.createNotification(
            config.getCreatedBy(),
            NotificationType.AUTHORIZATION_EXPIRED,
            NotificationSeverity.CRITICAL,
            "Monitoring Blocked — Authorization Expired",
            "Scheduled security monitoring was automatically BLOCKED for " + config.getTarget().getName() + " due to authorization expiration.",
            "TARGET",
            config.getTarget().getId().toString()
        );

        auditService.logEvent(
            null, config.getCreatedBy(),
            AuditEventType.MONITORING_BLOCKED,
            "TARGET", config.getTarget().getId().toString(),
            "BLOCK_MONITORING", reason,
            null, null
        );
    }

    private Instant calculateNextRun(Instant from, MonitoringFrequency frequency) {
        return switch (frequency) {
            case DAILY -> from.plus(1, ChronoUnit.DAYS);
            case WEEKLY -> from.plus(7, ChronoUnit.DAYS);
            case MONTHLY -> from.plus(30, ChronoUnit.DAYS);
            case CUSTOM -> from.plus(1, ChronoUnit.DAYS);
        };
    }

    public MonitoringConfigurationDto toDto(MonitoringConfiguration c) {
        return new MonitoringConfigurationDto(
            c.getId().toString(),
            c.getUuid(),
            c.getTarget().getId().toString(),
            c.getTarget().getName(),
            c.getTarget().getPrimaryUrl(),
            c.getProfile() != null ? c.getProfile().getId().toString() : null,
            c.getProfile() != null ? c.getProfile().getName() : "Standard Profile",
            c.getFrequency(),
            c.isEnabled(),
            c.getNextRunAt(),
            c.getLastRunAt(),
            c.getLastStatus(),
            c.getCreatedBy(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }
}
