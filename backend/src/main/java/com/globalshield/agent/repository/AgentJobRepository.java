package com.globalshield.agent.repository;

import com.globalshield.agent.entity.AgentJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentJobRepository extends JpaRepository<AgentJob, UUID> {
    List<AgentJob> findByAgentIdOrderByCreatedAtDesc(UUID agentId);
    List<AgentJob> findByAgentIdAndStatus(UUID agentId, String status);
    Optional<AgentJob> findFirstByAgentIdAndStatusOrderByCreatedAtAsc(UUID agentId, String status);
    List<AgentJob> findByStatusOrderByCreatedAtDesc(String status);
}
