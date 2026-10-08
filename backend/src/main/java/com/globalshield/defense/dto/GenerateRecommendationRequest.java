package com.globalshield.defense.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class GenerateRecommendationRequest {
    private UUID findingId;
    private Boolean useAiAnalysis = true;
}
