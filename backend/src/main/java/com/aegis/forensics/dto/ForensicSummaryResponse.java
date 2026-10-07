package com.aegis.forensics.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ForensicSummaryResponse {
    private UUID caseId;
    private String caseNumber;
    private String title;
    private String status;
    private String observedSourceIp;
    private String sourceIpOrigin;
    private List<String> factualFindings;
    private String assessmentSummary;
    private boolean exploitationEstablished;
    private String attributionStatus;
}
