package com.globalshield.target;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TargetScopeRepository extends JpaRepository<TargetScope, UUID> {

    List<TargetScope> findByTargetId(UUID targetId);
}
