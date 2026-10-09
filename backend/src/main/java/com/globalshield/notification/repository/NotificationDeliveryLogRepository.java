package com.globalshield.notification.repository;

import com.globalshield.notification.entity.NotificationDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationDeliveryLogRepository extends JpaRepository<NotificationDeliveryLog, UUID> {
    Optional<NotificationDeliveryLog> findByIdempotencyKey(String idempotencyKey);
    List<NotificationDeliveryLog> findTop50ByOrderByCreatedAtDesc();
}
