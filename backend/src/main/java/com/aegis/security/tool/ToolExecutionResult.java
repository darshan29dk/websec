package com.aegis.security.tool;

import com.aegis.assessment.AssessmentStage;
import com.aegis.assessment.execution.ToolExecutionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolExecutionResult {

    private String toolName;
    private AssessmentStage stage;
    private ToolExecutionStatus status;
    private Integer exitCode;
    private String stdout;
    private String stderr;
    private String errorMessage;
    private Instant startedAt;
    private Instant completedAt;
    private long durationMs;
}
