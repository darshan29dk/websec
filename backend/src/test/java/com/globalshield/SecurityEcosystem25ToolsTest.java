package com.globalshield;

import com.globalshield.assessment.AssessmentProfile;
import com.globalshield.assessment.ProfileType;
import com.globalshield.exception.BadRequestException;
import com.globalshield.security.policy.AuthorizationValidator;
import com.globalshield.security.policy.ScopeValidator;
import com.globalshield.security.policy.TargetNetworkPolicy;
import com.globalshield.security.policy.ToolPolicyValidator;
import com.globalshield.security.tool.ProcessRunner;
import com.globalshield.security.tool.status.SecurityToolService;
import com.globalshield.security.tool.status.SecurityToolStatus;
import com.globalshield.security.tool.status.SecurityToolStatusRepository;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.TargetAuthorization;
import com.globalshield.target.TargetStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityEcosystem25ToolsTest {

    @Mock
    private SecurityToolStatusRepository toolRepository;

    @Mock
    private ProcessRunner processRunner;

    @Mock
    private TargetNetworkPolicy networkPolicy;

    private SecurityToolService toolService;
    private ScopeValidator scopeValidator;
    private AuthorizationValidator authorizationValidator;
    private ToolPolicyValidator toolPolicyValidator;

    @BeforeEach
    void setUp() {
        toolService = new SecurityToolService(toolRepository, processRunner);
        scopeValidator = new ScopeValidator(networkPolicy);
        authorizationValidator = new AuthorizationValidator();
        toolPolicyValidator = new ToolPolicyValidator();
    }

    @Test
    void testAll25ToolsPresentInRegistry() {
        List<String> tools = SecurityToolService.ALL_25_TOOLS;
        assertEquals(25, tools.size(), "Ecosystem registry must contain exactly 25 tools");

        // Verify key tools across categories
        assertTrue(tools.contains("Nmap"));
        assertTrue(tools.contains("Amass"));
        assertTrue(tools.contains("Subfinder"));
        assertTrue(tools.contains("theHarvester"));
        assertTrue(tools.contains("Shodan"));
        assertTrue(tools.contains("Burp Suite"));
        assertTrue(tools.contains("OWASP ZAP"));
        assertTrue(tools.contains("Nikto"));
        assertTrue(tools.contains("Gobuster"));
        assertTrue(tools.contains("SQLmap"));
        assertTrue(tools.contains("Wireshark"));
        assertTrue(tools.contains("tcpdump"));
        assertTrue(tools.contains("Zeek"));
        assertTrue(tools.contains("Suricata"));
        assertTrue(tools.contains("Snort"));
        assertTrue(tools.contains("Wazuh"));
        assertTrue(tools.contains("Splunk"));
        assertTrue(tools.contains("Elastic Security"));
        assertTrue(tools.contains("Microsoft Sentinel"));
        assertTrue(tools.contains("Security Onion"));
        assertTrue(tools.contains("Autopsy"));
        assertTrue(tools.contains("FTK Imager"));
        assertTrue(tools.contains("Volatility"));
        assertTrue(tools.contains("Plaso"));
        assertTrue(tools.contains("Ghidra"));
    }

    @Test
    void testToolMetadataClassification() {
        when(toolRepository.findByToolNameIgnoreCase("SQLmap")).thenReturn(Optional.empty());
        when(toolRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SecurityToolStatus sqlmapStatus = toolService.checkToolHealth("SQLmap");
        assertEquals("WEB_SECURITY", sqlmapStatus.getCategory());
        assertEquals("EXECUTABLE_SCANNER", sqlmapStatus.getIntegrationType());
        assertTrue(sqlmapStatus.isAuthorizationRequired());

        when(toolRepository.findByToolNameIgnoreCase("Zeek")).thenReturn(Optional.empty());
        SecurityToolStatus zeekStatus = toolService.checkToolHealth("Zeek");
        assertEquals("NETWORK_SECURITY", zeekStatus.getCategory());
        assertEquals("TELEMETRY_SOURCE", zeekStatus.getIntegrationType());

        when(toolRepository.findByToolNameIgnoreCase("Wazuh")).thenReturn(Optional.empty());
        SecurityToolStatus wazuhStatus = toolService.checkToolHealth("Wazuh");
        assertEquals("BLUE_TEAM_SIEM", wazuhStatus.getCategory());
        assertEquals("SIEM_CONNECTOR", wazuhStatus.getIntegrationType());

        when(toolRepository.findByToolNameIgnoreCase("Autopsy")).thenReturn(Optional.empty());
        SecurityToolStatus autopsyStatus = toolService.checkToolHealth("Autopsy");
        assertEquals("DIGITAL_FORENSICS", autopsyStatus.getCategory());
        assertEquals("FORENSICS_TOOL", autopsyStatus.getIntegrationType());
    }

    @Test
    void testSqlmapGatedPolicyRestriction() {
        AssessmentProfile standardProfile = AssessmentProfile.builder()
                .profileType(ProfileType.STANDARD_AUTHORIZED)
                .name("Standard")
                .build();

        SecurityTarget target = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Test Target")
                .primaryUrl("https://example-authorized.com")
                .status(TargetStatus.ACTIVE)
                .build();

        // SQLmap should be rejected under STANDARD_AUTHORIZED
        assertThrows(BadRequestException.class, () ->
                toolPolicyValidator.validateToolExecutionPolicy("SQLmap", standardProfile, target));

        // SQLmap should pass under COMPREHENSIVE_AUTHORIZED when target has valid authorization
        AssessmentProfile comprehensiveProfile = AssessmentProfile.builder()
                .profileType(ProfileType.COMPREHENSIVE_AUTHORIZED)
                .name("Comprehensive")
                .build();

        TargetAuthorization auth = TargetAuthorization.builder()
                .id(UUID.randomUUID())
                .authorizationDate(LocalDate.now().minusDays(1))
                .expirationDate(LocalDate.now().plusDays(30))
                .build();
        target.setAuthorizations(List.of(auth));

        assertDoesNotThrow(() ->
                toolPolicyValidator.validateToolExecutionPolicy("SQLmap", comprehensiveProfile, target));
    }

    @Test
    void testPassiveProfileBlocksActiveScanners() {
        AssessmentProfile passiveProfile = AssessmentProfile.builder()
                .profileType(ProfileType.PASSIVE)
                .name("Passive")
                .build();

        SecurityTarget target = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Passive Target")
                .primaryUrl("https://example.com")
                .status(TargetStatus.ACTIVE)
                .build();

        assertThrows(BadRequestException.class, () ->
                toolPolicyValidator.validateToolExecutionPolicy("Nmap", passiveProfile, target));

        assertThrows(BadRequestException.class, () ->
                toolPolicyValidator.validateToolExecutionPolicy("Nikto", passiveProfile, target));

        // Shodan and theHarvester should be permitted
        assertDoesNotThrow(() ->
                toolPolicyValidator.validateToolExecutionPolicy("Shodan", passiveProfile, target));

        assertDoesNotThrow(() ->
                toolPolicyValidator.validateToolExecutionPolicy("theHarvester", passiveProfile, target));
    }

    @Test
    void testAuthorizationValidationRejectsExpiredOrMissingAuth() {
        SecurityTarget targetNoAuth = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("No Auth Target")
                .primaryUrl("https://example.com")
                .status(TargetStatus.ACTIVE)
                .build();

        assertThrows(BadRequestException.class, () ->
                authorizationValidator.validateAuthorization(targetNoAuth));

        // Target with expired authorization
        TargetAuthorization expiredAuth = TargetAuthorization.builder()
                .id(UUID.randomUUID())
                .authorizationDate(LocalDate.now().minusDays(40))
                .expirationDate(LocalDate.now().minusDays(10))
                .build();

        SecurityTarget targetExpired = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Expired Target")
                .primaryUrl("https://example.com")
                .status(TargetStatus.ACTIVE)
                .authorizations(List.of(expiredAuth))
                .build();

        assertThrows(BadRequestException.class, () ->
                authorizationValidator.validateAuthorization(targetExpired));

        // Target with valid authorization
        TargetAuthorization validAuth = TargetAuthorization.builder()
                .id(UUID.randomUUID())
                .authorizationDate(LocalDate.now().minusDays(1))
                .expirationDate(LocalDate.now().plusDays(10))
                .build();

        SecurityTarget targetValid = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Valid Target")
                .primaryUrl("https://example.com")
                .status(TargetStatus.ACTIVE)
                .authorizations(List.of(validAuth))
                .build();

        assertDoesNotThrow(() ->
                authorizationValidator.validateAuthorization(targetValid));
    }

    @Test
    void testScopeValidatorSubdomainBoundary() {
        SecurityTarget target = SecurityTarget.builder()
                .primaryUrl("https://app.globalshield.internal")
                .build();

        assertTrue(scopeValidator.isInScope(target, "app.globalshield.internal"));
        assertTrue(scopeValidator.isInScope(target, "api.app.globalshield.internal"));
        assertFalse(scopeValidator.isInScope(target, "unauthorized-domain.com"));
    }
}
