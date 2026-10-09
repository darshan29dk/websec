package com.globalshield.fuzzing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReproduceTestCaseRequest {

    @NotNull(message = "Test case ID is required")
    private UUID testCaseId;

    private String customPayloadOverride;
}
