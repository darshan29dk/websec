package com.globalshield.fuzzing.repository;

import com.globalshield.fuzzing.entity.FuzzingCampaign;
import com.globalshield.fuzzing.entity.FuzzingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FuzzingCampaignRepository extends JpaRepository<FuzzingCampaign, UUID> {

    List<FuzzingCampaign> findByTargetIdOrderByCreatedAtDesc(UUID targetId);

    Page<FuzzingCampaign> findByTargetId(UUID targetId, Pageable pageable);

    List<FuzzingCampaign> findByStatus(FuzzingStatus status);

    long countByTargetId(UUID targetId);
}
