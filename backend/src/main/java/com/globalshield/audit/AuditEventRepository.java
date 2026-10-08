package com.globalshield.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

    @Query("SELECT a FROM AuditEvent a WHERE " +
           "(:actorEmail IS NULL OR LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', COALESCE(:actorEmail, ''), '%'))) AND " +
           "(:eventType IS NULL OR a.eventType = :eventType) AND " +
           "(:resourceType IS NULL OR LOWER(a.resourceType) LIKE LOWER(CONCAT('%', COALESCE(:resourceType, ''), '%'))) AND " +
           "(:search IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', COALESCE(:search, ''), '%')) OR LOWER(a.details) LIKE LOWER(CONCAT('%', COALESCE(:search, ''), '%')))")
    Page<AuditEvent> searchAuditEvents(
            @Param("actorEmail") String actorEmail,
            @Param("eventType") AuditEventType eventType,
            @Param("resourceType") String resourceType,
            @Param("search") String search,
            Pageable pageable
    );
}
