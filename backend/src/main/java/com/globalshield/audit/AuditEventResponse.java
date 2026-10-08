package com.globalshield.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEventResponse {
    private UUID id;
    private UUID actorUserId;
    private String actorEmail;
    private AuditEventType eventType;
    private String resourceType;
    private String resourceId;
    private String action;
    private String details;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;

    public static AuditEventResponse fromEntity(AuditEvent event) {
        if (event == null) return null;
        return AuditEventResponse.builder()
                .id(event.getId())
                .actorUserId(event.getActorUserId())
                .actorEmail(event.getActorEmail())
                .eventType(event.getEventType())
                .resourceType(event.getResourceType())
                .resourceId(event.getResourceId())
                .action(event.getAction())
                .details(event.getDetails())
                .ipAddress(event.getIpAddress())
                .userAgent(event.getUserAgent())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
