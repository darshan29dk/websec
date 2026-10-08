package com.globalshield.attacksurface.repository;

import com.globalshield.attacksurface.entity.Technology;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TechnologyRepository extends JpaRepository<Technology, UUID> {

    List<Technology> findByAssessmentId(UUID assessmentId);

    Page<Technology> findByAssessmentId(UUID assessmentId, Pageable pageable);

    Optional<Technology> findByAssessmentIdAndName(UUID assessmentId, String name);

    long countByAssessmentId(UUID assessmentId);
}
