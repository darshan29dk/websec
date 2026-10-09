package com.globalshield.notification.repository;

import com.globalshield.notification.entity.NotificationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationConfigRepository extends JpaRepository<NotificationConfig, UUID> {
    Optional<NotificationConfig> findFirstByEnabledTrue();
}
