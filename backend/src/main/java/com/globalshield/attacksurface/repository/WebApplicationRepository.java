package com.globalshield.attacksurface.repository;

import com.globalshield.attacksurface.entity.WebApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebApplicationRepository extends JpaRepository<WebApplication, UUID> {

    List<WebApplication> findByAssessmentId(UUID assessmentId);

    Page<WebApplication> findByAssessmentId(UUID assessmentId, Pageable pageable);

    Optional<WebApplication> findByAssessmentIdAndBaseUrl(UUID assessmentId, String baseUrl);

    long countByAssessmentId(UUID assessmentId);
}
