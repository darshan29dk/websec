package com.globalshield.security.tool.status;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityToolStatusRepository extends JpaRepository<SecurityToolStatus, UUID> {
    Optional<SecurityToolStatus> findByToolNameIgnoreCase(String toolName);
}
