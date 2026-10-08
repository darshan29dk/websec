package com.globalshield.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NetworkEventRepository extends JpaRepository<NetworkEvent, UUID> {
    Optional<NetworkEvent> findBySecurityEventId(UUID securityEventId);
}
