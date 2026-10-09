package com.globalshield.agent.repository;

import com.globalshield.agent.entity.SecurityAgent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityAgentRepository extends JpaRepository<SecurityAgent, UUID> {
    Optional<SecurityAgent> findByAgentKeyHash(String agentKeyHash);
    List<SecurityAgent> findByRevokedFalseOrderByCreatedAtDesc();
    List<SecurityAgent> findByStatus(String status);
}
