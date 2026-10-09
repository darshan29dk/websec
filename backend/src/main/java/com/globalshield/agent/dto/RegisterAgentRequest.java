package com.globalshield.agent.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterAgentRequest {

    @NotBlank(message = "Agent name is required")
    private String name;

    private String hostname;
    private String ipAddress;
    private String operatingSystem;
    private String agentVersion;
    private List<String> capabilities; // allowlisted tool names
}
