package com.globalshield.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_configurations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "provider_type", nullable = false, length = 32)
    @Builder.Default
    private String providerType = "SMTP"; // SMTP, CONSOLE_AUDIT_LOG, WEBHOOK

    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    @Builder.Default
    private Integer smtpPort = 587;

    @Column(name = "smtp_username")
    private String smtpUsername;

    @Column(name = "smtp_password_encrypted", length = 512)
    private String smtpPasswordEncrypted;

    @Column(name = "smtp_from", nullable = false)
    @Builder.Default
    private String smtpFrom = "security-alerts@globalshield.internal";

    @Column(name = "smtp_auth", nullable = false)
    @Builder.Default
    private boolean smtpAuth = true;

    @Column(name = "smtp_starttls", nullable = false)
    @Builder.Default
    private boolean smtpStarttls = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "recipient_emails", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String recipientEmails = "[]"; // JSON array of email strings

    @Column(name = "subscribed_events", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String subscribedEvents = "[\"CRITICAL_FINDING_DETECTED\", \"HIGH_FINDING_DETECTED\", \"ASSESSMENT_COMPLETED\", \"ASSESSMENT_FAILED\", \"INCIDENT_ATTENTION_REQUIRED\", \"REMEDIATION_FAILURE\", \"VERIFICATION_FAILURE\", \"CONFIRMED_FIX\", \"REGRESSION_DETECTED\", \"TARGET_AUTHORIZATION_EXPIRING\"]";

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
