package com.globalshield.agent.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RegisterAgentResponse {
    private UUID agentId;
    private String name;
    private String rawAgentKey; // Shown only once upon registration
    private String status;
    private String capabilities;
    private Instant registeredAt;
}
