package com.globalshield.finding.repository;

import com.globalshield.finding.entity.FindingReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FindingReferenceRepository extends JpaRepository<FindingReference, UUID> {

    List<FindingReference> findByFindingId(UUID findingId);
}
