package com.globalshield.target;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetRequest {

    @NotBlank(message = "Target name is required")
    @Size(min = 2, max = 255, message = "Target name must be between 2 and 255 characters")
    private String name;

    @NotBlank(message = "Primary URL is required")
    private String primaryUrl;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;
}
