package com.aegis.detection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DetectionMatchRepository extends JpaRepository<DetectionMatch, UUID> {
    Page<DetectionMatch> findByTargetId(UUID targetId, Pageable pageable);
    List<DetectionMatch> findByEventId(UUID eventId);
    Page<DetectionMatch> findByStatus(MatchStatus status, Pageable pageable);
}
