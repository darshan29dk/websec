package com.globalshield.target;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TargetAuthorizationRepository extends JpaRepository<TargetAuthorization, UUID> {

    List<TargetAuthorization> findByTargetIdOrderByCreatedAtDesc(UUID targetId);

    @Query("SELECT a FROM TargetAuthorization a WHERE a.target.id = :targetId " +
           "AND a.authorizationDate <= :today AND a.expirationDate >= :today " +
           "ORDER BY a.expirationDate DESC")
    List<TargetAuthorization> findValidAuthorizationsForTarget(@Param("targetId") UUID targetId, @Param("today") LocalDate today);

    default Optional<TargetAuthorization> findLatestValidAuthorization(UUID targetId) {
        List<TargetAuthorization> validList = findValidAuthorizationsForTarget(targetId, LocalDate.now());
        return validList.isEmpty() ? Optional.empty() : Optional.of(validList.get(0));
    }
}
