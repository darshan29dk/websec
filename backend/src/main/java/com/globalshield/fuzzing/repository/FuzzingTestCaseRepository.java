package com.globalshield.fuzzing.repository;

import com.globalshield.fuzzing.entity.FuzzingTestCase;
import com.globalshield.fuzzing.entity.TestCaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FuzzingTestCaseRepository extends JpaRepository<FuzzingTestCase, UUID> {

    List<FuzzingTestCase> findByCampaignIdOrderByExecutionOrderAsc(UUID campaignId);

    Page<FuzzingTestCase> findByCampaignId(UUID campaignId, Pageable pageable);

    List<FuzzingTestCase> findByCampaignIdAndStatus(UUID campaignId, TestCaseStatus status);

    long countByCampaignId(UUID campaignId);

    long countByCampaignIdAndStatus(UUID campaignId, TestCaseStatus status);
}
