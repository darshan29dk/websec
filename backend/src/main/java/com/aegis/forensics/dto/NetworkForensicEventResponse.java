package com.aegis.forensics.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NetworkForensicEventResponse {
    private UUID id;
    private UUID caseId;
    private UUID evidenceId;
    private Instant eventTime;
    private String sourceIp;
    private Integer sourcePort;
    private String destinationIp;
    private Integer destinationPort;
    private String protocol;
    private String direction;
    private String connectionState;
    private Long bytesIn;
    private Long bytesOut;
    private String sensorSource;
    private String metadata;
    private Instant createdAt;
}
