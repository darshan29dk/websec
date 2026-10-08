package com.globalshield.notification.repository;

import com.globalshield.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Optional<Notification> findByUuid(String uuid);

    Page<Notification> findByUserEmailOrderByCreatedAtDesc(String userEmail, Pageable pageable);

    List<Notification> findByUserEmailAndReadFalse(String userEmail);

    long countByUserEmailAndReadFalse(String userEmail);
}
