package com.globalshield.attackchain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttackChainRepository extends JpaRepository<AttackChain, UUID> {
    Optional<AttackChain> findByInvestigationId(UUID investigationId);
}
