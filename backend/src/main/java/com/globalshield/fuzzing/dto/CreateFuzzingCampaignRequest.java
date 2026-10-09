package com.globalshield.fuzzing.dto;

import com.globalshield.fuzzing.entity.FuzzingProfile;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFuzzingCampaignRequest {

    @NotNull(message = "Target ID is required")
    private UUID targetId;

    private UUID assessmentId;

    @NotBlank(message = "Campaign name is required")
    private String name;

    @NotNull(message = "Fuzzing profile is required")
    private FuzzingProfile profile;

    @Min(value = 1, message = "Rate limit must be at least 1 RPS")
    @Max(value = 50, message = "Rate limit cannot exceed 50 RPS to protect target stability")
    @Builder.Default
    private Integer rateLimitRps = 5;

    @Min(value = 5, message = "Max requests must be at least 5")
    @Max(value = 500, message = "Max requests cannot exceed 500 per campaign")
    @Builder.Default
    private Integer maxRequests = 100;

    @Min(value = 1000, message = "Timeout must be at least 1000ms")
    @Max(value = 30000, message = "Timeout cannot exceed 30000ms")
    @Builder.Default
    private Integer timeoutMs = 10000;

    @Min(value = 1, message = "Concurrency must be at least 1")
    @Max(value = 5, message = "Concurrency cannot exceed 5")
    @Builder.Default
    private Integer concurrency = 1;

    private List<String> categories;

    private List<UUID> selectedEndpointIds;

    private String customHeaders;

    private String openApiSpec;

    private boolean enableMultiStepSequences;
}
