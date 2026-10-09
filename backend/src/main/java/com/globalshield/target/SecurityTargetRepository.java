package com.globalshield.target;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SecurityTargetRepository extends JpaRepository<SecurityTarget, UUID> {

    Page<SecurityTarget> findByStatus(TargetStatus status, Pageable pageable);

    Page<SecurityTarget> findByNameContainingIgnoreCaseOrPrimaryUrlContainingIgnoreCase(
            String name, String primaryUrl, Pageable pageable);

    Page<SecurityTarget> findByStatusAndNameContainingIgnoreCaseOrStatusAndPrimaryUrlContainingIgnoreCase(
            TargetStatus status1, String name, TargetStatus status2, String primaryUrl, Pageable pageable);

    boolean existsByPrimaryUrlAndStatusNot(String primaryUrl, TargetStatus status);

    long countByStatus(TargetStatus status);
}
