package com.aegis.security.tool;

import com.aegis.assessment.AssessmentStage;
import com.aegis.target.SecurityTarget;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolExecutionRequest {

    private UUID assessmentId;
    private SecurityTarget target;
    private AssessmentStage stage;
    @Builder.Default
    private Duration timeout = Duration.ofSeconds(300);
}
