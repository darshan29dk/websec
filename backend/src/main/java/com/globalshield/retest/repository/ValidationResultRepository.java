package com.globalshield.retest.repository;

import com.globalshield.retest.entity.ValidationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ValidationResultRepository extends JpaRepository<ValidationResult, UUID> {
    Optional<ValidationResult> findByUuid(String uuid);
    List<ValidationResult> findByValidationIdOrderByCreatedAtAsc(UUID validationId);
}
