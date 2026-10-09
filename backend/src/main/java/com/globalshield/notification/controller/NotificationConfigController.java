package com.globalshield.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalshield.common.ApiResponse;
import com.globalshield.notification.entity.NotificationConfig;
import com.globalshield.notification.entity.NotificationDeliveryLog;
import com.globalshield.notification.repository.NotificationConfigRepository;
import com.globalshield.notification.repository.NotificationDeliveryLogRepository;
import com.globalshield.notification.service.PlatformNotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationConfigController {

    private final NotificationConfigRepository configRepository;
    private final NotificationDeliveryLogRepository logRepository;
    private final PlatformNotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    public static class UpdateNotificationConfigRequest {
        private String providerType; // SMTP, CONSOLE_AUDIT_LOG
        private String smtpHost;
        private Integer smtpPort;
        private String smtpUsername;
        private String smtpPassword;
        private String smtpFrom;
        private boolean enabled;
        private List<String> recipientEmails;
        private List<String> subscribedEvents;
    }

    @Data
    public static class TestEmailRequest {
        private String recipientEmail;
    }

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'SECURITY_LEAD', 'ANALYST')")
    public ResponseEntity<ApiResponse<NotificationConfig>> getConfig() {
        NotificationConfig config = configRepository.findFirstByEnabledTrue()
                .orElseGet(() -> NotificationConfig.builder()
                        .providerType("CONSOLE_AUDIT_LOG")
                        .smtpFrom("security-alerts@globalshield.internal")
                        .enabled(true)
                        .recipientEmails("[\"security-team@globalshield.internal\"]")
                        .createdBy("system")
                        .build());
        return ResponseEntity.ok(ApiResponse.success("Notification configuration retrieved", config));
    }

    @PostMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NotificationConfig>> updateConfig(
            @RequestBody UpdateNotificationConfigRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : "system";

        NotificationConfig config = configRepository.findFirstByEnabledTrue()
                .orElseGet(() -> NotificationConfig.builder().createdBy(email).build());

        if (request.getProviderType() != null) config.setProviderType(request.getProviderType());
        if (request.getSmtpHost() != null) config.setSmtpHost(request.getSmtpHost());
        if (request.getSmtpPort() != null) config.setSmtpPort(request.getSmtpPort());
        if (request.getSmtpUsername() != null) config.setSmtpUsername(request.getSmtpUsername());
        if (request.getSmtpPassword() != null) config.setSmtpPasswordEncrypted(request.getSmtpPassword());
        if (request.getSmtpFrom() != null) config.setSmtpFrom(request.getSmtpFrom());
        config.setEnabled(request.isEnabled());

        try {
            if (request.getRecipientEmails() != null) {
                config.setRecipientEmails(objectMapper.writeValueAsString(request.getRecipientEmails()));
            }
            if (request.getSubscribedEvents() != null) {
                config.setSubscribedEvents(objectMapper.writeValueAsString(request.getSubscribedEvents()));
            }
        } catch (Exception ignored) {}

        config = configRepository.save(config);
        return ResponseEntity.ok(ApiResponse.success("Notification configuration updated", config));
    }

    @PostMapping("/test-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'SECURITY_LEAD')")
    public ResponseEntity<ApiResponse<Void>> sendTestEmail(
            @RequestBody TestEmailRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String recipient = (request != null && request.getRecipientEmail() != null && !request.getRecipientEmail().isBlank())
                ? request.getRecipientEmail()
                : (userDetails != null ? userDetails.getUsername() : "security@example.com");

        notificationService.sendTestNotification(recipient);
        return ResponseEntity.ok(ApiResponse.success("Test notification dispatched to " + recipient, null));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'SECURITY_LEAD', 'ANALYST')")
    public ResponseEntity<ApiResponse<List<NotificationDeliveryLog>>> getDeliveryLogs() {
        List<NotificationDeliveryLog> logs = logRepository.findTop50ByOrderByCreatedAtDesc();
        return ResponseEntity.ok(ApiResponse.success("Recent notification delivery logs retrieved", logs));
    }
}
