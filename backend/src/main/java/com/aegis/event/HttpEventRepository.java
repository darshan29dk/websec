package com.aegis.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface HttpEventRepository extends JpaRepository<HttpEvent, UUID> {
    Optional<HttpEvent> findBySecurityEventId(UUID securityEventId);
}
