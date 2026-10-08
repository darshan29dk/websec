package com.globalshield.finding.dto;

import com.globalshield.finding.entity.FindingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateFindingStatusRequest {

    @NotNull(message = "New finding status is mandatory")
    private FindingStatus newStatus;

    private String comment;
}
