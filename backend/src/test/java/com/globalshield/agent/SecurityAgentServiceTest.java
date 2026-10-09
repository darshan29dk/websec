package com.globalshield.agent;

import com.globalshield.agent.dto.*;
import com.globalshield.agent.entity.AgentJob;
import com.globalshield.agent.entity.SecurityAgent;
import com.globalshield.agent.repository.AgentJobRepository;
import com.globalshield.agent.repository.SecurityAgentRepository;
import com.globalshield.agent.service.SecurityAgentService;
import com.globalshield.audit.AuditService;
import com.globalshield.exception.BadRequestException;
import com.globalshield.security.policy.AuthorizationValidator;
import com.globalshield.security.policy.TargetNetworkPolicy;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityAgentServiceTest {

    @Mock private SecurityAgentRepository agentRepository;
    @Mock private AgentJobRepository jobRepository;
    @Mock private SecurityTargetRepository targetRepository;
    @Mock private AuthorizationValidator authorizationValidator;
    @Mock private TargetNetworkPolicy networkPolicy;
    @Mock private AuditService auditService;

    private SecurityAgentService agentService;

    @BeforeEach
    void setUp() {
        agentService = new SecurityAgentService(
                agentRepository, jobRepository, targetRepository,
                authorizationValidator, networkPolicy, auditService
        );
    }

    @Test
    void testRegisterAgentGeneratesValidKey() {
        RegisterAgentRequest req = RegisterAgentRequest.builder()
                .name("Lab Worker Agent 01")
                .hostname("lab-worker-1.local")
                .capabilities(List.of("Nmap", "Wireshark"))
                .build();

        when(agentRepository.save(any())).thenAnswer(inv -> {
            SecurityAgent a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        RegisterAgentResponse res = agentService.registerAgent(req, UUID.randomUUID(), "admin@globalshield.internal");

        assertNotNull(res.getAgentId());
        assertTrue(res.getRawAgentKey().startsWith("gsa_"));
        assertEquals("REGISTERED", res.getStatus());
        verify(agentRepository).save(any());
    }

    @Test
    void testQueueAgentJobRejectsUnadvertisedCapability() {
        UUID agentId = UUID.randomUUID();
        SecurityAgent agent = SecurityAgent.builder()
                .id(agentId)
                .name("Network Agent")
                .capabilities("[\"Nmap\", \"Wireshark\"]")
                .revoked(false)
                .build();

        UUID targetId = UUID.randomUUID();
        SecurityTarget target = SecurityTarget.builder()
                .id(targetId)
                .name("Target")
                .primaryUrl("https://target.local")
                .build();

        when(agentRepository.findById(agentId)).thenReturn(Optional.of(agent));
        when(targetRepository.findById(targetId)).thenReturn(Optional.of(target));

        CreateAgentJobRequest req = CreateAgentJobRequest.builder()
                .agentId(agentId)
                .targetId(targetId)
                .toolName("Ghidra") // Ghidra not advertised on this network agent!
                .operation("disassemble")
                .build();

        assertThrows(BadRequestException.class, () ->
                agentService.queueAgentJob(req, UUID.randomUUID(), "admin@globalshield.internal"));
    }

    @Test
    void testRevokeAgentPreventsNewJobs() {
        UUID agentId = UUID.randomUUID();
        SecurityAgent agent = SecurityAgent.builder()
                .id(agentId)
                .name("Compromised Agent")
                .capabilities("[\"Nmap\"]")
                .revoked(true)
                .build();

        when(agentRepository.findById(agentId)).thenReturn(Optional.of(agent));

        CreateAgentJobRequest req = CreateAgentJobRequest.builder()
                .agentId(agentId)
                .targetId(UUID.randomUUID())
                .toolName("Nmap")
                .operation("port_scan")
                .build();

        assertThrows(BadRequestException.class, () ->
                agentService.queueAgentJob(req, UUID.randomUUID(), "admin@globalshield.internal"));
    }
}
