package com.globalshield.agent.dto;

import com.globalshield.agent.entity.AgentJob;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AgentJobResponse {
    private UUID jobId;
    private UUID agentId;
    private String agentName;
    private UUID targetId;
    private String targetName;
    private String targetUrl;
    private String toolName;
    private String operation;
    private String parametersJson;
    private String status;
    private Integer timeoutSeconds;
    private boolean scopeVerified;
    private Integer exitCode;
    private String stdoutSanitized;
    private String stderrSanitized;
    private String errorMessage;
    private Instant createdAt;
    private Instant dispatchedAt;
    private Instant completedAt;

    public static AgentJobResponse fromEntity(AgentJob job) {
        return AgentJobResponse.builder()
                .jobId(job.getId())
                .agentId(job.getAgent().getId())
                .agentName(job.getAgent().getName())
                .targetId(job.getTarget() != null ? job.getTarget().getId() : null)
                .targetName(job.getTarget() != null ? job.getTarget().getName() : null)
                .targetUrl(job.getTarget() != null ? job.getTarget().getPrimaryUrl() : null)
                .toolName(job.getToolName())
                .operation(job.getOperation())
                .parametersJson(job.getParametersJson())
                .status(job.getStatus())
                .timeoutSeconds(job.getTimeoutSeconds())
                .scopeVerified(job.isScopeVerified())
                .exitCode(job.getExitCode())
                .stdoutSanitized(job.getStdoutSanitized())
                .stderrSanitized(job.getStderrSanitized())
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .dispatchedAt(job.getDispatchedAt())
                .completedAt(job.getCompletedAt())
                .build();
    }
}
