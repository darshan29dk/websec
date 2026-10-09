package com.globalshield.fuzzing.repository;

import com.globalshield.fuzzing.entity.FuzzingCoverageResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FuzzingCoverageResultRepository extends JpaRepository<FuzzingCoverageResult, UUID> {

    List<FuzzingCoverageResult> findByCampaignIdOrderByOwaspCategoryAsc(UUID campaignId);

    Optional<FuzzingCoverageResult> findByCampaignIdAndOwaspCategory(UUID campaignId, String owaspCategory);

    void deleteByCampaignId(UUID campaignId);
}
