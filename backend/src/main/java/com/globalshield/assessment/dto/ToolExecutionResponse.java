package com.globalshield.assessment.dto;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.execution.ToolExecution;
import com.globalshield.assessment.execution.ToolExecutionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ToolExecutionResponse {
    private UUID id;
    private UUID assessmentId;
    private String toolName;
    private AssessmentStage stage;
    private ToolExecutionStatus status;
    private Instant startedAt;
    private Instant completedAt;
    private Long durationMs;
    private Integer exitCode;
    private String stdoutReference;
    private String stderrReference;
    private String errorMessage;
    private Instant createdAt;

    public static ToolExecutionResponse fromEntity(ToolExecution execution) {
        return ToolExecutionResponse.builder()
                .id(execution.getId())
                .assessmentId(execution.getAssessment() != null ? execution.getAssessment().getId() : null)
                .toolName(execution.getToolName())
                .stage(execution.getStage())
                .status(execution.getStatus())
                .startedAt(execution.getStartedAt())
                .completedAt(execution.getCompletedAt())
                .durationMs(execution.getDurationMs())
                .exitCode(execution.getExitCode())
                .stdoutReference(execution.getStdoutOutput())
                .stderrReference(execution.getStderrOutput())
                .errorMessage(execution.getErrorMessage())
                .createdAt(execution.getCreatedAt())
                .build();
    }
}
