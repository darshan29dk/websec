package com.globalshield.finding.repository;

import com.globalshield.finding.entity.FindingCorrelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FindingCorrelationRepository extends JpaRepository<FindingCorrelation, UUID> {

    List<FindingCorrelation> findByFindingId(UUID findingId);

    List<FindingCorrelation> findByRelatedFindingId(UUID relatedFindingId);
}
