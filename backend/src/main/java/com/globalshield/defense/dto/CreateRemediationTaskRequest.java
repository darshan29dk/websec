package com.globalshield.defense.dto;

import lombok.Data;

@Data
public class CreateRemediationTaskRequest {
    private String title;
    private String description;
    private String taskType;
    private Integer sequence = 1;
    private String owner;
}
