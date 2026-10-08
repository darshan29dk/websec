package com.aegis.retest.repository;

import com.aegis.retest.entity.DefenseValidation;
import com.aegis.retest.entity.ValidationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DefenseValidationRepository extends JpaRepository<DefenseValidation, UUID> {
    Optional<DefenseValidation> findByUuid(String uuid);
    Optional<DefenseValidation> findByRetestId(UUID retestId);
    List<DefenseValidation> findByFindingIdOrderByValidatedAtDesc(UUID findingId);
    List<DefenseValidation> findByFindingAssessmentTargetId(UUID targetId);
    long countByValidationStatus(ValidationStatus validationStatus);
}

