package com.aegis.notification.controller;

import com.aegis.common.PageResponse;
import com.aegis.notification.dto.NotificationDto;
import com.aegis.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<PageResponse<NotificationDto>> getNotifications(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(notificationService.getUserNotifications(email, page, size));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(notificationService.getUnreadNotifications(email));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "admin@aegis.local";
        notificationService.markAllAsRead(email);
        return ResponseEntity.ok().build();
    }
}
