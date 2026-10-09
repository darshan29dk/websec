package com.globalshield.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalshield.agent.dto.*;
import com.globalshield.agent.entity.AgentJob;
import com.globalshield.agent.entity.SecurityAgent;
import com.globalshield.agent.repository.AgentJobRepository;
import com.globalshield.agent.repository.SecurityAgentRepository;
import com.globalshield.audit.AuditService;
import com.globalshield.audit.AuditEventType;
import com.globalshield.exception.BadRequestException;
import com.globalshield.exception.ResourceNotFoundException;
import com.globalshield.security.policy.AuthorizationValidator;
import com.globalshield.security.policy.TargetNetworkPolicy;
import com.globalshield.security.tool.status.SecurityToolService;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAgentService {

    private final SecurityAgentRepository agentRepository;
    private final AgentJobRepository jobRepository;
    private final SecurityTargetRepository targetRepository;
    private final AuthorizationValidator authorizationValidator;
    private final TargetNetworkPolicy networkPolicy;
    private final AuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public RegisterAgentResponse registerAgent(RegisterAgentRequest request, UUID userId, String userEmail) {
        log.info("Registering new secure execution agent: '{}'", request.getName());

        // Generate cryptographically secure agent key
        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        String rawKey = "gsa_" + HexFormat.of().formatHex(randomBytes);
        String keyHash = hashKey(rawKey);

        List<String> validCapabilities = request.getCapabilities() != null
                ? request.getCapabilities().stream()
                .filter(c -> SecurityToolService.ALL_25_TOOLS.stream().anyMatch(t -> t.equalsIgnoreCase(c)))
                .toList()
                : List.of("Nmap", "Wireshark", "Volatility");

        String capabilitiesJson;
        try {
            capabilitiesJson = objectMapper.writeValueAsString(validCapabilities);
        } catch (Exception e) {
            capabilitiesJson = "[]";
        }

        SecurityAgent agent = SecurityAgent.builder()
                .name(request.getName())
                .agentKeyHash(keyHash)
                .hostname(request.getHostname() != null ? request.getHostname() : "localhost")
                .ipAddress(request.getIpAddress() != null ? request.getIpAddress() : "127.0.0.1")
                .operatingSystem(request.getOperatingSystem() != null ? request.getOperatingSystem() : "linux")
                .agentVersion(request.getAgentVersion() != null ? request.getAgentVersion() : "1.0.0")
                .capabilities(capabilitiesJson)
                .status("REGISTERED")
                .createdBy(userEmail)
                .build();

        agent = agentRepository.save(agent);

        auditService.logEvent(
                userId, userEmail,
                AuditEventType.AGENT_REGISTERED,
                "SECURITY_AGENT", agent.getId().toString(),
                "REGISTER_AGENT", "Registered local agent: " + agent.getName(),
                null, null
        );

        return RegisterAgentResponse.builder()
                .agentId(agent.getId())
                .name(agent.getName())
                .rawAgentKey(rawKey)
                .status(agent.getStatus())
                .capabilities(capabilitiesJson)
                .registeredAt(agent.getRegisteredAt())
                .build();
    }

    @Transactional
    public void recordHeartbeat(String rawAgentKey, AgentHeartbeatRequest request) {
        SecurityAgent agent = authenticateAgent(rawAgentKey);
        agent.setLastHeartbeatAt(Instant.now());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            agent.setStatus(request.getStatus().toUpperCase());
        } else {
            agent.setStatus("ONLINE");
        }
        agentRepository.save(agent);
    }

    @Transactional
    public Optional<AgentJobResponse> pollNextJob(String rawAgentKey) {
        SecurityAgent agent = authenticateAgent(rawAgentKey);
        agent.setLastHeartbeatAt(Instant.now());

        Optional<AgentJob> jobOpt = jobRepository.findFirstByAgentIdAndStatusOrderByCreatedAtAsc(agent.getId(), "QUEUED");
        if (jobOpt.isEmpty()) {
            return Optional.empty();
        }

        AgentJob job = jobOpt.get();
        job.setStatus("DISPATCHED");
        job.setDispatchedAt(Instant.now());
        jobRepository.save(job);

        agent.setStatus("BUSY");
        agentRepository.save(agent);

        log.info("Dispatched job ID: {} (tool: {}) to agent: {}", job.getId(), job.getToolName(), agent.getName());
        return Optional.of(AgentJobResponse.fromEntity(job));
    }

    @Transactional
    public AgentJobResponse submitJobResult(String rawAgentKey, UUID jobId, SubmitAgentJobResultRequest result) {
        SecurityAgent agent = authenticateAgent(rawAgentKey);

        AgentJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("AgentJob", "id", jobId));

        if (!job.getAgent().getId().equals(agent.getId())) {
            throw new BadRequestException("Agent is not assigned to this job.");
        }

        job.setCompletedAt(Instant.now());
        job.setExitCode(result.getExitCode());
        job.setStdoutSanitized(sanitizeOutput(result.getStdout()));
        job.setStderrSanitized(sanitizeOutput(result.getStderr()));
        job.setErrorMessage(result.getErrorMessage());
        job.setEvidenceReference(result.getEvidenceReference());

        if (result.getExitCode() != null && result.getExitCode() == 0) {
            job.setStatus("COMPLETED");
        } else {
            job.setStatus("FAILED");
        }

        job = jobRepository.save(job);
        agent.setStatus("ONLINE");
        agentRepository.save(agent);

        log.info("Agent {} finished job ID: {} with status: {}", agent.getName(), job.getId(), job.getStatus());
        return AgentJobResponse.fromEntity(job);
    }

    @Transactional
    public AgentJobResponse queueAgentJob(CreateAgentJobRequest request, UUID userId, String userEmail) {
        SecurityAgent agent = agentRepository.findById(request.getAgentId())
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAgent", "id", request.getAgentId()));

        if (agent.isRevoked()) {
            throw new BadRequestException("Cannot dispatch jobs to revoked agent: " + agent.getName());
        }

        SecurityTarget target = targetRepository.findById(request.getTargetId())
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", request.getTargetId()));

        // Validate target authorization
        authorizationValidator.validateAuthorization(target);
        networkPolicy.validateTargetNetworkAccess(target);

        // Validate tool capability
        if (!agent.getCapabilities().toLowerCase().contains(request.getToolName().toLowerCase())) {
            throw new BadRequestException("Agent " + agent.getName() + " does not advertise capability for tool: " + request.getToolName());
        }

        // Validate strictly structured parameters (prevent shell injection)
        String paramsJson;
        try {
            paramsJson = objectMapper.writeValueAsString(request.getParameters() != null ? request.getParameters() : Map.of());
        } catch (Exception e) {
            paramsJson = "{}";
        }

        AgentJob job = AgentJob.builder()
                .agent(agent)
                .target(target)
                .toolName(request.getToolName())
                .operation(request.getOperation())
                .parametersJson(paramsJson)
                .status("QUEUED")
                .timeoutSeconds(request.getTimeoutSeconds() != null ? request.getTimeoutSeconds() : 300)
                .scopeVerified(true)
                .createdBy(userEmail)
                .build();

        job = jobRepository.save(job);

        auditService.logEvent(
                userId, userEmail,
                AuditEventType.AGENT_JOB_DISPATCHED,
                "AGENT_JOB", job.getId().toString(),
                "QUEUE_JOB", "Queued job for agent: " + agent.getName() + " tool: " + job.getToolName(),
                null, null
        );

        return AgentJobResponse.fromEntity(job);
    }

    @Transactional
    public void revokeAgent(UUID agentId, String reason, UUID userId, String userEmail) {
        SecurityAgent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAgent", "id", agentId));

        agent.setRevoked(true);
        agent.setStatus("REVOKED");
        agent.setRevocationReason(reason != null ? reason : "Revoked by administrator");
        agentRepository.save(agent);

        auditService.logEvent(
                userId, userEmail,
                AuditEventType.AGENT_REVOKED,
                "SECURITY_AGENT", agent.getId().toString(),
                "REVOKE_AGENT", "Revoked agent: " + agent.getName() + " Reason: " + agent.getRevocationReason(),
                null, null
        );
        log.warn("Security agent revoked: ID: {}, Name: {}", agent.getId(), agent.getName());
    }

    @Transactional(readOnly = true)
    public List<SecurityAgent> listActiveAgents() {
        return agentRepository.findByRevokedFalseOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<AgentJobResponse> getAgentJobs(UUID agentId) {
        return jobRepository.findByAgentIdOrderByCreatedAtDesc(agentId).stream()
                .map(AgentJobResponse::fromEntity)
                .toList();
    }

    private SecurityAgent authenticateAgent(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            throw new BadRequestException("Agent authorization key is required.");
        }
        String keyHash = hashKey(rawKey.trim());
        SecurityAgent agent = agentRepository.findByAgentKeyHash(keyHash)
                .orElseThrow(() -> new BadRequestException("Invalid or unrecognized agent key."));

        if (agent.isRevoked()) {
            throw new BadRequestException("This agent has been revoked: " + agent.getRevocationReason());
        }

        return agent;
    }

    private String hashKey(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 digest failed", e);
        }
    }

    private String sanitizeOutput(String output) {
        if (output == null) return null;
        if (output.length() > 65536) {
            output = output.substring(0, 65536) + "\n...[TRUNCATED AT 64KB]...";
        }
        return output
                .replaceAll("(?i)(password|token|secret|authorization|api[-_]?key)\\s*[:=]\\s*['\"]?[^'\"\\s]+", "$1: [REDACTED]");
    }
}
