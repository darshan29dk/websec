package com.globalshield.notification.controller;

import com.globalshield.common.ApiResponse;
import com.globalshield.common.PageResponse;
import com.globalshield.notification.dto.NotificationDto;
import com.globalshield.notification.service.NotificationService;
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
    public ResponseEntity<ApiResponse<PageResponse<NotificationDto>>> getNotifications(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUserNotifications(email, page, size)));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUnreadNotifications(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "admin@aegis.local";
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadNotifications(email)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markAsRead(id)));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "admin@aegis.local";
        notificationService.markAllAsRead(email);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }
}
