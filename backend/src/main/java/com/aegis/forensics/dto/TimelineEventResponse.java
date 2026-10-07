package com.aegis.forensics.dto;

import com.aegis.forensics.enums.EvidenceConfidence;
import com.aegis.forensics.enums.TimelineEventType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TimelineEventResponse {
    private UUID id;
    private UUID caseId;
    private Instant eventTime;
    private String timeDescription;
    private TimelineEventType eventType;
    private String source;
    private String severity;
    private String title;
    private String description;
    private UUID evidenceId;
    private EvidenceConfidence confidence;
    private Integer sequenceNumber;
    private Instant createdAt;
}
