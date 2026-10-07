package com.aegis.investigation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvestigationRepository extends JpaRepository<Investigation, UUID> {
    Optional<Investigation> findByIncidentId(UUID incidentId);
    Page<Investigation> findByStatus(InvestigationStatus status, Pageable pageable);
}
