package com.globalshield.attacksurface.repository;

import com.globalshield.attacksurface.entity.EndpointType;
import com.globalshield.attacksurface.entity.WebEndpoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebEndpointRepository extends JpaRepository<WebEndpoint, UUID> {

    List<WebEndpoint> findByAssessmentId(UUID assessmentId);

    Page<WebEndpoint> findByAssessmentId(UUID assessmentId, Pageable pageable);

    Optional<WebEndpoint> findByAssessmentIdAndNormalizedUrlAndMethod(UUID assessmentId, String normalizedUrl, String method);

    long countByAssessmentId(UUID assessmentId);

    long countByAssessmentIdAndEndpointType(UUID assessmentId, EndpointType endpointType);

    long countByAssessmentTargetId(UUID targetId);

    List<WebEndpoint> findByAssessmentTargetId(UUID targetId);
}

