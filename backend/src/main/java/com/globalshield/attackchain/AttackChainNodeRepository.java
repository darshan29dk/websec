package com.globalshield.attackchain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttackChainNodeRepository extends JpaRepository<AttackChainNode, UUID> {
    List<AttackChainNode> findByAttackChainIdOrderByEventTimeAsc(UUID attackChainId);
}
