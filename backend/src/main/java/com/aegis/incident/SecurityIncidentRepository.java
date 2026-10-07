package com.aegis.incident;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityIncidentRepository extends JpaRepository<SecurityIncident, UUID> {

    Optional<SecurityIncident> findByCorrelationKey(String correlationKey);

    @Query("SELECT i FROM SecurityIncident i WHERE " +
           "(:targetId IS NULL OR i.targetId = :targetId) AND " +
           "(:severity IS NULL OR i.severity = :severity) AND " +
           "(:status IS NULL OR i.status = :status)")
    Page<SecurityIncident> findIncidentsFiltered(
            @Param("targetId") UUID targetId,
            @Param("severity") IncidentSeverity severity,
            @Param("status") IncidentStatus status,
            Pageable pageable
    );
}
