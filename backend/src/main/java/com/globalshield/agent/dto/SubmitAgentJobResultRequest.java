package com.globalshield.agent.dto;

import lombok.Data;

@Data
public class SubmitAgentJobResultRequest {
    private Integer exitCode;
    private String stdout;
    private String stderr;
    private String errorMessage;
    private String evidenceReference;
}
