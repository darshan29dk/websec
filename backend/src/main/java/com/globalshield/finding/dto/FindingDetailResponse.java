package com.globalshield.finding.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FindingDetailResponse {
    private SecurityFindingResponse finding;
    private List<FindingEvidenceResponse> evidence;
    private List<FindingReferenceResponse> references;
    private List<FindingCorrelationResponse> correlations;
    private List<FindingCommentResponse> comments;
}
