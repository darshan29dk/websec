package com.globalshield.fuzzing.repository;

import com.globalshield.fuzzing.entity.FuzzingMultiStepSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FuzzingMultiStepSequenceRepository extends JpaRepository<FuzzingMultiStepSequence, UUID> {

    List<FuzzingMultiStepSequence> findByCampaignId(UUID campaignId);
}
