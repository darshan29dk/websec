package com.aegis.notification.dto;

import com.aegis.notification.entity.NotificationSeverity;
import com.aegis.notification.entity.NotificationType;

import java.time.Instant;

public record NotificationDto(
    String id,
    String uuid,
    String userEmail,
    NotificationType type,
    NotificationSeverity severity,
    String title,
    String message,
    String resourceType,
    String resourceId,
    boolean read,
    Instant createdAt,
    Instant readAt
) {}
