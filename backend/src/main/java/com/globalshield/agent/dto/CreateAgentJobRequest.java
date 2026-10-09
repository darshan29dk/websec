package com.globalshield.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAgentJobRequest {

    @NotNull(message = "Agent ID is required")
    private UUID agentId;

    @NotNull(message = "Target ID is required")
    private UUID targetId;

    @NotBlank(message = "Tool name is required")
    private String toolName;

    @NotBlank(message = "Operation is required")
    private String operation;

    // Structured parameters (e.g. {"scanType": "SYN", "ports": "80,443", "timing": "T3"})
    // Raw arbitrary commands or shell scripts are strictly disallowed!
    private Map<String, Object> parameters;

    private Integer timeoutSeconds;
}
