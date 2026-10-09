package com.globalshield.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_delivery_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDeliveryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(nullable = false, length = 512)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String severity = "INFO";

    @Column(name = "target_url", length = 1024)
    private String targetUrl;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "SUBMITTED_TO_PROVIDER"; // SUBMITTED_TO_PROVIDER, DELIVERED, FAILED, SKIPPED

    @Column(name = "provider_type", nullable = false, length = 32)
    @Builder.Default
    private String providerType = "SMTP";

    @Column(name = "provider_response", columnDefinition = "TEXT")
    private String providerResponse;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "idempotency_key", nullable = false, length = 128)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
