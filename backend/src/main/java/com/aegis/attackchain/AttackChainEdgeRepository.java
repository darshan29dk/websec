package com.aegis.attackchain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttackChainEdgeRepository extends JpaRepository<AttackChainEdge, UUID> {
    List<AttackChainEdge> findByAttackChainId(UUID attackChainId);
}
