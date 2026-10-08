package com.globalshield.forensics.dto;

import com.globalshield.forensics.enums.CasePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateForensicCaseRequest {
    @NotNull(message = "Target ID is required")
    private UUID targetId;

    private UUID incidentId;
    private UUID assessmentId;

    @NotBlank(message = "Title is required")
    private String title;

    private CasePriority priority = CasePriority.MEDIUM;
}
