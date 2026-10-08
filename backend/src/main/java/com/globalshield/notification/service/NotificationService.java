package com.globalshield.notification.service;

import com.globalshield.audit.AuditEventType;
import com.globalshield.audit.AuditService;
import com.globalshield.common.PageResponse;
import com.globalshield.notification.dto.NotificationDto;
import com.globalshield.notification.entity.Notification;
import com.globalshield.notification.entity.NotificationSeverity;
import com.globalshield.notification.entity.NotificationType;
import com.globalshield.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuditService auditService;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Transactional
    public NotificationDto createNotification(
        String userEmail,
        NotificationType type,
        NotificationSeverity severity,
        String title,
        String message,
        String resourceType,
        String resourceId
    ) {
        Notification notification = Notification.builder()
            .userEmail(userEmail != null ? userEmail : "admin@aegis.local")
            .type(type)
            .severity(severity != null ? severity : NotificationSeverity.INFO)
            .title(title)
            .message(message)
            .resourceType(resourceType)
            .resourceId(resourceId)
            .read(false)
            .createdAt(Instant.now())
            .build();

        notification = notificationRepository.save(notification);

        // Attempt optional SMTP dispatch
        if (smtpHost != null && !smtpHost.isBlank()) {
            log.info("SMTP configured. Dispatching email notification [{}] to {}", title, userEmail);
        } else {
            log.debug("SMTP host not configured. In-app notification created only.");
        }

        auditService.logEvent(
            null,
            userEmail != null ? userEmail : "SYSTEM",
            AuditEventType.NOTIFICATION_CREATED,
            resourceType != null ? resourceType : "NOTIFICATION",
            notification.getId().toString(),
            "CREATE_NOTIFICATION",
            "Created notification [" + type + "]: " + title,
            null,
            null
        );

        return toDto(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> getUserNotifications(String userEmail, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> pageResult = notificationRepository.findByUserEmailOrderByCreatedAtDesc(userEmail, pageRequest);
        return PageResponse.from(pageResult.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(String userEmail) {
        return notificationRepository.findByUserEmailAndReadFalse(userEmail)
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public NotificationDto markAsRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        notification.setRead(true);
        notification.setReadAt(Instant.now());
        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        List<Notification> unread = notificationRepository.findByUserEmailAndReadFalse(userEmail);
        Instant now = Instant.now();
        for (Notification n : unread) {
            n.setRead(true);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
    }

    public NotificationDto toDto(Notification n) {
        return new NotificationDto(
            n.getId().toString(),
            n.getUuid(),
            n.getUserEmail(),
            n.getType(),
            n.getSeverity(),
            n.getTitle(),
            n.getMessage(),
            n.getResourceType(),
            n.getResourceId(),
            n.isRead(),
            n.getCreatedAt(),
            n.getReadAt()
        );
    }
}
