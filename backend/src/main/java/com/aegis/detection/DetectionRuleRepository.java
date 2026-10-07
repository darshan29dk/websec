package com.aegis.detection;

import com.aegis.event.SecurityEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DetectionRuleRepository extends JpaRepository<DetectionRule, UUID> {
    List<DetectionRule> findByEnabledTrue();
    List<DetectionRule> findByEventTypeAndEnabledTrue(SecurityEventType eventType);
}
