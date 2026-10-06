package com.aegis.assessment.result;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssessmentObservationRepository extends JpaRepository<AssessmentObservation, UUID> {

    List<AssessmentObservation> findByAssessmentId(UUID assessmentId);

    Page<AssessmentObservation> findByAssessmentId(UUID assessmentId, Pageable pageable);

    long countByAssessmentId(UUID assessmentId);
}
