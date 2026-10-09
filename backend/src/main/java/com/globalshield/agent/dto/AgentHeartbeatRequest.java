package com.globalshield.agent.dto;

import lombok.Data;

import java.util.List;

@Data
public class AgentHeartbeatRequest {
    private String status; // ONLINE, BUSY, IDLE
    private List<String> currentCapabilities;
}
