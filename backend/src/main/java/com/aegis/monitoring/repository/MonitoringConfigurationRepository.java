package com.aegis.monitoring.repository;

import com.aegis.monitoring.entity.MonitoringConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MonitoringConfigurationRepository extends JpaRepository<MonitoringConfiguration, UUID> {

    Optional<MonitoringConfiguration> findByUuid(String uuid);

    Optional<MonitoringConfiguration> findByTargetId(UUID targetId);

    List<MonitoringConfiguration> findByEnabledTrueAndNextRunAtBefore(Instant now);

    List<MonitoringConfiguration> findByEnabledTrue();
}
