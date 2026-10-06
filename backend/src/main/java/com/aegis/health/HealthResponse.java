package com.aegis.health;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthResponse {

    private String status; // "UP", "DOWN"
    private String applicationName;
    private String version;
    private Instant timestamp;
    private Map<String, Object> components;
}
