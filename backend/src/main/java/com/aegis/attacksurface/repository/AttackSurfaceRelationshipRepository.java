package com.aegis.attacksurface.repository;

import com.aegis.attacksurface.entity.AttackSurfaceRelationship;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttackSurfaceRelationshipRepository extends JpaRepository<AttackSurfaceRelationship, UUID> {

    List<AttackSurfaceRelationship> findByAssessmentId(UUID assessmentId);

    Page<AttackSurfaceRelationship> findByAssessmentId(UUID assessmentId, Pageable pageable);

    long countByAssessmentId(UUID assessmentId);
}
