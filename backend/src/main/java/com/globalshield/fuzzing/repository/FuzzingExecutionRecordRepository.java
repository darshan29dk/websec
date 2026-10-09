package com.globalshield.fuzzing.repository;

import com.globalshield.fuzzing.entity.FuzzingExecutionRecord;
import com.globalshield.fuzzing.entity.TestResultClassification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FuzzingExecutionRecordRepository extends JpaRepository<FuzzingExecutionRecord, UUID> {

    List<FuzzingExecutionRecord> findByCampaignIdOrderByExecutedAtDesc(UUID campaignId);

    Page<FuzzingExecutionRecord> findByCampaignId(UUID campaignId, Pageable pageable);

    Page<FuzzingExecutionRecord> findByCampaignIdAndResultClassification(
            UUID campaignId, TestResultClassification classification, Pageable pageable);

    List<FuzzingExecutionRecord> findByCampaignIdAndResultClassificationIn(
            UUID campaignId, List<TestResultClassification> classifications);

    Optional<FuzzingExecutionRecord> findTopByTestCaseIdOrderByExecutedAtDesc(UUID testCaseId);

    long countByCampaignIdAndResultClassification(UUID campaignId, TestResultClassification classification);

    long countByCampaignId(UUID campaignId);
}
