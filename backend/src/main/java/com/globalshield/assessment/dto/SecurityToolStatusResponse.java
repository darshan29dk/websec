package com.globalshield.assessment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SecurityToolStatusResponse {
    private String tool;
    private boolean configured;
    private boolean available;
    private String version;
    private String status;
}
