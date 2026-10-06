package com.aegis.assessment;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAssessmentRequest {

    @NotNull(message = "Target ID is required")
    private UUID targetId;

    @NotNull(message = "Profile ID is required")
    private UUID profileId;

    @NotNull(message = "Explicit authorization confirmation is required")
    private Boolean authorizationConfirmed;
}
