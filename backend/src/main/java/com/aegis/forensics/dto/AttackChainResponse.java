package com.aegis.forensics.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AttackChainResponse {
    private UUID caseId;
    private List<AttackEventResponse> events;
    private long totalObservedNodes;
    private long totalDerivedNodes;
    private long totalInferredNodes;
}
