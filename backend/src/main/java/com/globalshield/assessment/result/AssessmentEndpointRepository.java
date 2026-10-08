package com.globalshield.assessment.result;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssessmentEndpointRepository extends JpaRepository<AssessmentEndpoint, UUID> {

    List<AssessmentEndpoint> findByAssessmentId(UUID assessmentId);

    Page<AssessmentEndpoint> findByAssessmentId(UUID assessmentId, Pageable pageable);

    long countByAssessmentId(UUID assessmentId);
}
