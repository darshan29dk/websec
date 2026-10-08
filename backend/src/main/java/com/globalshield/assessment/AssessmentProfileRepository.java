package com.globalshield.assessment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssessmentProfileRepository extends JpaRepository<AssessmentProfile, UUID> {

    List<AssessmentProfile> findByEnabledTrue();

    Optional<AssessmentProfile> findByProfileType(ProfileType profileType);
}
