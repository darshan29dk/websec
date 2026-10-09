package com.globalshield.notification.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.notification.entity.NotificationConfig;
import com.globalshield.notification.entity.NotificationDeliveryLog;
import com.globalshield.notification.provider.AuditableLogEmailProvider;
import com.globalshield.notification.provider.SmtpEmailProvider;
import com.globalshield.notification.repository.NotificationConfigRepository;
import com.globalshield.notification.repository.NotificationDeliveryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformNotificationService {

    private final NotificationConfigRepository configRepository;
    private final NotificationDeliveryLogRepository logRepository;
    private final SmtpEmailProvider smtpEmailProvider;
    private final AuditableLogEmailProvider auditEmailProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void notifyFindingDetected(SecurityFinding finding) {
        if (finding == null || finding.getSeverity() == null) return;
        String sev = finding.getSeverity().name();
        if (!"CRITICAL".equals(sev) && !"HIGH".equals(sev)) {
            return; // Only notify on Critical and High findings
        }

        String eventType = "CRITICAL".equals(sev) ? "CRITICAL_FINDING_DETECTED" : "HIGH_FINDING_DETECTED";
        String targetUrl = finding.getEndpoint() != null ? finding.getEndpoint().getUrl()
                : (finding.getAsset() != null ? finding.getAsset().getAssetValue() : "Target Asset");
        String subject = "GlobalShield Alert: " + sev + " Severity Finding Detected: " + finding.getTitle();

        String summary = String.format(
                "Event: %s\nSeverity: %s\nFinding: %s\nTarget: %s\nDescription: %s\n" +
                "Recommended Action: Review finding in GlobalShield, inspect evidence, and initiate remediation plan.\n" +
                "Platform Link: https://globalshield.internal/findings/%s",
                eventType, sev, finding.getTitle(), targetUrl,
                sanitizeText(finding.getDescription()),
                finding.getId()
        );

        dispatchNotification(eventType, subject, summary, sev, targetUrl, finding.getId().toString());
    }

    @Transactional
    public void notifyAssessmentCompleted(UUID assessmentId, String targetName, String primaryUrl, int findingCount) {
        String eventType = "ASSESSMENT_COMPLETED";
        String subject = "GlobalShield Notice: Security Assessment Completed for " + targetName;
        String summary = String.format(
                "Security assessment has completed successfully.\nTarget: %s (%s)\nIdentified Findings: %d\n" +
                "Platform Link: https://globalshield.internal/assessments/%s",
                targetName, primaryUrl, findingCount, assessmentId
        );
        dispatchNotification(eventType, subject, summary, "INFO", primaryUrl, assessmentId.toString());
    }

    @Transactional
    public void notifyAssessmentFailed(UUID assessmentId, String targetName, String primaryUrl, String errorMessage) {
        String eventType = "ASSESSMENT_FAILED";
        String subject = "GlobalShield Warning: Security Assessment Failed for " + targetName;
        String summary = String.format(
                "Security assessment failed during execution.\nTarget: %s (%s)\nError: %s\n" +
                "Platform Link: https://globalshield.internal/assessments/%s",
                targetName, primaryUrl, sanitizeText(errorMessage), assessmentId
        );
        dispatchNotification(eventType, subject, summary, "HIGH", primaryUrl, assessmentId.toString());
    }

    @Transactional
    public void notifyRemediationEvent(UUID planId, String title, String eventType, String status) {
        String subject = "GlobalShield Remediation: " + title + " (" + status + ")";
        String summary = String.format(
                "Remediation Plan: %s\nStatus: %s\nEvent: %s\n" +
                "Platform Link: https://globalshield.internal/remediation",
                title, status, eventType
        );
        dispatchNotification(eventType, subject, summary, "MEDIUM", "Internal Defense", planId.toString());
    }

    @Transactional
    public void sendTestNotification(String recipientEmail) {
        String eventType = "TEST_MESSAGE";
        String subject = "GlobalShield Security Platform — Test Notification";
        String summary = "This is a verified test notification from the GlobalShield Autonomous Security Platform.\n" +
                "Notification engine, event subscriptions, and provider delivery interfaces are operating correctly.";
        sendToRecipient(recipientEmail, eventType, subject, summary, "INFO", "localhost", "test-" + UUID.randomUUID());
    }

    private void dispatchNotification(String eventType, String subject, String summary, String severity, String targetUrl, String entityKey) {
        Optional<NotificationConfig> configOpt = configRepository.findFirstByEnabledTrue();
        if (configOpt.isEmpty()) {
            log.debug("No active notification configuration found. Skipping notification dispatch for event: {}", eventType);
            return;
        }

        NotificationConfig config = configOpt.get();
        List<String> recipients = parseJsonList(config.getRecipientEmails());
        List<String> subscriptions = parseJsonList(config.getSubscribedEvents());

        if (!subscriptions.isEmpty() && !subscriptions.contains(eventType)) {
            log.debug("Event {} is not in subscribed events list. Skipping.", eventType);
            return;
        }

        for (String recipient : recipients) {
            sendToRecipient(recipient, eventType, subject, summary, severity, targetUrl, entityKey);
        }
    }

    private void sendToRecipient(String recipient, String eventType, String subject, String summary, String severity, String targetUrl, String entityKey) {
        String idempotencyKey = computeIdempotencyKey(eventType, entityKey, recipient);

        // Check idempotency (prevent spamming same finding to same user repeatedly)
        if (logRepository.findByIdempotencyKey(idempotencyKey).isPresent()) {
            log.debug("Idempotent notification already recorded for key {}. Skipping duplicate.", idempotencyKey);
            return;
        }

        boolean sentViaSmtp = smtpEmailProvider.sendEmail(recipient, subject, summary, summary);
        String status = sentViaSmtp ? "DELIVERED" : "SUBMITTED_TO_PROVIDER";
        String provider = sentViaSmtp ? "SMTP" : "CONSOLE_AUDIT_LOG";

        if (!sentViaSmtp) {
            auditEmailProvider.sendEmail(recipient, subject, summary, summary);
        }

        NotificationDeliveryLog deliveryLog = NotificationDeliveryLog.builder()
                .eventType(eventType)
                .recipientEmail(recipient)
                .subject(subject)
                .summary(summary)
                .severity(severity)
                .targetUrl(targetUrl)
                .status(status)
                .providerType(provider)
                .providerResponse(sentViaSmtp ? "Dispatched successfully via SMTP" : "Recorded in audit stream")
                .idempotencyKey(idempotencyKey)
                .sentAt(Instant.now())
                .build();

        logRepository.save(deliveryLog);
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String computeIdempotencyKey(String eventType, String entityKey, String recipient) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String raw = eventType + ":" + entityKey + ":" + recipient;
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    private String sanitizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("(?i)(password|token|secret|authorization|api[-_]?key)\\s*[:=]\\s*['\"]?[^'\"\\s]+", "$1: [REDACTED]");
    }
}
