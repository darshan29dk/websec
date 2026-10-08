package com.globalshield.posture.repository;

import com.globalshield.posture.entity.RegressionConfidence;
import com.globalshield.posture.entity.RegressionStatus;
import com.globalshield.posture.entity.RegressionType;
import com.globalshield.posture.entity.SecurityRegression;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityRegressionRepository extends JpaRepository<SecurityRegression, UUID> {

    Optional<SecurityRegression> findByUuid(String uuid);

    List<SecurityRegression> findByTargetIdOrderByDetectedAtDesc(UUID targetId);

    List<SecurityRegression> findByTargetIdAndRegressionType(UUID targetId, RegressionType regressionType);

    List<SecurityRegression> findByTargetIdAndStatus(UUID targetId, RegressionStatus status);

    List<SecurityRegression> findByTargetIdAndConfidence(UUID targetId, RegressionConfidence confidence);

    Optional<SecurityRegression> findByTargetIdAndFindingFingerprintAndStatus(UUID targetId, String findingFingerprint, RegressionStatus status);

    long countByTargetIdAndStatus(UUID targetId, RegressionStatus status);
}
