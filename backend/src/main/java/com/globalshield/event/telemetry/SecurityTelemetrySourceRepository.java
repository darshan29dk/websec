package com.globalshield.event.telemetry;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityTelemetrySourceRepository extends JpaRepository<SecurityTelemetrySource, UUID> {
    Optional<SecurityTelemetrySource> findByNameIgnoreCase(String name);
    List<SecurityTelemetrySource> findBySourceTypeIgnoreCase(String sourceType);
    List<SecurityTelemetrySource> findByEnabledTrue();
}
