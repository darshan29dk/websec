package com.globalshield.notification;

import com.globalshield.finding.entity.FindingSeverity;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.notification.entity.NotificationConfig;
import com.globalshield.notification.entity.NotificationDeliveryLog;
import com.globalshield.notification.provider.AuditableLogEmailProvider;
import com.globalshield.notification.provider.SmtpEmailProvider;
import com.globalshield.notification.repository.NotificationConfigRepository;
import com.globalshield.notification.repository.NotificationDeliveryLogRepository;
import com.globalshield.notification.service.PlatformNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PlatformNotificationServiceTest {

    @Mock private NotificationConfigRepository configRepository;
    @Mock private NotificationDeliveryLogRepository logRepository;
    @Mock private SmtpEmailProvider smtpEmailProvider;
    @Mock private AuditableLogEmailProvider auditEmailProvider;

    private PlatformNotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new PlatformNotificationService(
                configRepository, logRepository, smtpEmailProvider, auditEmailProvider
        );
    }

    @Test
    void testCriticalFindingTriggersNotificationAndRedactsSecrets() {
        NotificationConfig config = NotificationConfig.builder()
                .enabled(true)
                .recipientEmails("[\"soc@globalshield.internal\"]")
                .subscribedEvents("[\"CRITICAL_FINDING_DETECTED\", \"HIGH_FINDING_DETECTED\"]")
                .build();

        when(configRepository.findFirstByEnabledTrue()).thenReturn(Optional.of(config));
        when(logRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
        when(smtpEmailProvider.sendEmail(any(), any(), any(), any())).thenReturn(true);

        com.globalshield.attacksurface.entity.WebEndpoint ep = com.globalshield.attacksurface.entity.WebEndpoint.builder()
                .url("https://target.local/api/v1/auth/session")
                .build();

        SecurityFinding finding = SecurityFinding.builder()
                .id(UUID.randomUUID())
                .title("Hardcoded Secret Leaked in Endpoint")
                .severity(FindingSeverity.CRITICAL)
                .description("API response contained auth_token: secret_bearer_token_12345 in body")
                .endpoint(ep)
                .build();

        notificationService.notifyFindingDetected(finding);

        ArgumentCaptor<NotificationDeliveryLog> captor = ArgumentCaptor.forClass(NotificationDeliveryLog.class);
        verify(logRepository).save(captor.capture());

        NotificationDeliveryLog savedLog = captor.getValue();
        assertEquals("CRITICAL_FINDING_DETECTED", savedLog.getEventType());
        assertEquals("soc@globalshield.internal", savedLog.getRecipientEmail());
        assertEquals("DELIVERED", savedLog.getStatus());
        // Verify secrets are redacted in summary
        assertFalse(savedLog.getSummary().contains("secret_bearer_token_12345"));
        assertTrue(savedLog.getSummary().contains("[REDACTED]"));
    }

    @Test
    void testDuplicateAlertsPreventedByIdempotency() {
        NotificationConfig config = NotificationConfig.builder()
                .enabled(true)
                .recipientEmails("[\"soc@globalshield.internal\"]")
                .subscribedEvents("[\"CRITICAL_FINDING_DETECTED\"]")
                .build();

        when(configRepository.findFirstByEnabledTrue()).thenReturn(Optional.of(config));
        // Idempotency check simulates duplicate notification already logged
        when(logRepository.findByIdempotencyKey(any())).thenReturn(Optional.of(NotificationDeliveryLog.builder().build()));

        SecurityFinding finding = SecurityFinding.builder()
                .id(UUID.randomUUID())
                .title("Duplicate Event")
                .severity(FindingSeverity.CRITICAL)
                .build();

        notificationService.notifyFindingDetected(finding);

        // Should not send email or save new delivery record
        verify(smtpEmailProvider, never()).sendEmail(any(), any(), any(), any());
    }
}
