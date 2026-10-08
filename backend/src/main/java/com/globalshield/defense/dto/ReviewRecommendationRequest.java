package com.globalshield.defense.dto;

import lombok.Data;

@Data
public class ReviewRecommendationRequest {
    private String action; // APPROVE, REJECT
    private String reviewNotes;
}
