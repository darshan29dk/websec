package com.globalshield.event;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, UUID> {

    Page<SecurityEvent> findByTargetId(UUID targetId, Pageable pageable);

    @Query("SELECT e FROM SecurityEvent e WHERE " +
           "(:targetId IS NULL OR e.targetId = :targetId) AND " +
           "(:eventType IS NULL OR e.eventType = :eventType) AND " +
           "(:eventSource IS NULL OR e.eventSource = :eventSource) AND " +
           "(:sourceIp IS NULL OR e.sourceIp = :sourceIp) AND " +
           "(:startTime IS NULL OR e.eventTime >= :startTime) AND " +
           "(:endTime IS NULL OR e.eventTime <= :endTime)")
    Page<SecurityEvent> findEventsFiltered(
            @Param("targetId") UUID targetId,
            @Param("eventType") SecurityEventType eventType,
            @Param("eventSource") EventSource eventSource,
            @Param("sourceIp") String sourceIp,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime,
            Pageable pageable
    );

    List<SecurityEvent> findByTargetIdAndEventTimeBetween(UUID targetId, OffsetDateTime startTime, OffsetDateTime endTime);
}
