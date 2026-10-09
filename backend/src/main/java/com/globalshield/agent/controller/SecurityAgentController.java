package com.globalshield.agent.controller;

import com.globalshield.agent.dto.*;
import com.globalshield.agent.entity.SecurityAgent;
import com.globalshield.agent.service.SecurityAgentService;
import com.globalshield.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
public class SecurityAgentController {

    private final SecurityAgentService agentService;

    // Platform User / Operator Endpoints
    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'SECURITY_LEAD')")
    public ResponseEntity<ApiResponse<RegisterAgentResponse>> registerAgent(
            @Valid @RequestBody RegisterAgentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : "system";
        RegisterAgentResponse response = agentService.registerAgent(request, null, email);
        return ResponseEntity.ok(ApiResponse.success("Agent registered successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'SECURITY_LEAD', 'ANALYST')")
    public ResponseEntity<ApiResponse<List<SecurityAgent>>> listAgents() {
        List<SecurityAgent> agents = agentService.listActiveAgents();
        return ResponseEntity.ok(ApiResponse.success("Agents retrieved successfully", agents));
    }

    @PostMapping("/jobs")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'SECURITY_LEAD')")
    public ResponseEntity<ApiResponse<AgentJobResponse>> queueJob(
            @Valid @RequestBody CreateAgentJobRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : "system";
        AgentJobResponse job = agentService.queueAgentJob(request, null, email);
        return ResponseEntity.ok(ApiResponse.success("Job queued for agent successfully", job));
    }

    @GetMapping("/{agentId}/jobs")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'SECURITY_LEAD', 'ANALYST')")
    public ResponseEntity<ApiResponse<List<AgentJobResponse>>> getAgentJobs(@PathVariable UUID agentId) {
        List<AgentJobResponse> jobs = agentService.getAgentJobs(agentId);
        return ResponseEntity.ok(ApiResponse.success("Agent jobs retrieved successfully", jobs));
    }

    @PostMapping("/{agentId}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> revokeAgent(
            @PathVariable UUID agentId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : "system";
        agentService.revokeAgent(agentId, reason, null, email);
        return ResponseEntity.ok(ApiResponse.success("Agent revoked successfully", null));
    }

    // Outbound Agent API Endpoints (Authenticated via X-Agent-Key header)
    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<Void>> heartbeat(
            @RequestHeader("X-Agent-Key") String agentKey,
            @RequestBody AgentHeartbeatRequest request
    ) {
        agentService.recordHeartbeat(agentKey, request);
        return ResponseEntity.ok(ApiResponse.success("Heartbeat recorded", null));
    }

    @GetMapping("/jobs/poll")
    public ResponseEntity<ApiResponse<AgentJobResponse>> pollJob(
            @RequestHeader("X-Agent-Key") String agentKey
    ) {
        Optional<AgentJobResponse> jobOpt = agentService.pollNextJob(agentKey);
        return ResponseEntity.ok(ApiResponse.success("Poll complete", jobOpt.orElse(null)));
    }

    @PostMapping("/jobs/{jobId}/result")
    public ResponseEntity<ApiResponse<AgentJobResponse>> submitJobResult(
            @RequestHeader("X-Agent-Key") String agentKey,
            @PathVariable UUID jobId,
            @RequestBody SubmitAgentJobResultRequest result
    ) {
        AgentJobResponse res = agentService.submitJobResult(agentKey, jobId, result);
        return ResponseEntity.ok(ApiResponse.success("Job result submitted successfully", res));
    }
}
