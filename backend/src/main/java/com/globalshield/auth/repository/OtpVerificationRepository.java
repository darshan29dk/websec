package com.globalshield.auth.repository;

import com.globalshield.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {

    Optional<OtpVerification> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(String email, String purpose);

    @Modifying
    @Query("UPDATE OtpVerification o SET o.used = true WHERE o.email = :email AND o.purpose = :purpose AND o.used = false")
    void invalidatePreviousOtps(String email, String purpose);
}
