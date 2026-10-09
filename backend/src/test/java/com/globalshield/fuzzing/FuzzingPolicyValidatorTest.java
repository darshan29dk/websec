package com.globalshield.fuzzing;

import com.globalshield.exception.BadRequestException;
import com.globalshield.fuzzing.dto.CreateFuzzingCampaignRequest;
import com.globalshield.fuzzing.entity.FuzzingProfile;
import com.globalshield.fuzzing.policy.FuzzingPolicyValidator;
import com.globalshield.security.policy.AuthorizationValidator;
import com.globalshield.security.policy.ScopeValidator;
import com.globalshield.security.policy.TargetNetworkPolicy;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FuzzingPolicyValidatorTest {

    @Mock
    private TargetNetworkPolicy networkPolicy;

    private ScopeValidator scopeValidator;
    private AuthorizationValidator authorizationValidator;
    private FuzzingPolicyValidator policyValidator;

    private SecurityTarget target;

    @BeforeEach
    void setUp() {
        scopeValidator = new ScopeValidator(networkPolicy);
        authorizationValidator = new AuthorizationValidator();
        policyValidator = new FuzzingPolicyValidator(networkPolicy, scopeValidator, authorizationValidator);

        target = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Authorized Target")
                .primaryUrl("https://example.com")
                .status(TargetStatus.ACTIVE)
                .authorizations(List.of(
                        TargetAuthorization.builder()
                                .id(UUID.randomUUID())
                                .authorizationDate(LocalDate.now().minusDays(1))
                                .expirationDate(LocalDate.now().plusDays(30))
                                .build()
                ))
                .build();
    }

    @Test
    void testValidCampaignPolicyPasses() {
        CreateFuzzingCampaignRequest req = CreateFuzzingCampaignRequest.builder()
                .targetId(target.getId())
                .profile(FuzzingProfile.SAFE_ACTIVE_FUZZ)
                .rateLimitRps(5)
                .maxRequests(100)
                .timeoutMs(5000)
                .build();

        assertDoesNotThrow(() -> policyValidator.validateCampaignPolicy(target, req));
    }

    @Test
    void testRateLimitOutOfBoundsRejection() {
        CreateFuzzingCampaignRequest highRateReq = CreateFuzzingCampaignRequest.builder()
                .targetId(target.getId())
                .profile(FuzzingProfile.SAFE_ACTIVE_FUZZ)
                .rateLimitRps(100) // Exceeds 50 RPS guardrail
                .maxRequests(100)
                .build();

        assertThrows(BadRequestException.class, () -> policyValidator.validateCampaignPolicy(target, highRateReq));
    }

    @Test
    void testEndpointScopeEscapeRejection() {
        // In-scope URL
        assertDoesNotThrow(() -> policyValidator.validateEndpointScope(target, "https://example.com/api/v1/users"));

        // Out-of-scope URL
        assertThrows(BadRequestException.class, () -> policyValidator.validateEndpointScope(target, "https://malicious.evil.com/leak"));
    }

    @Test
    void testRedirectDestinationScopeCheck() {
        assertTrue(policyValidator.isRedirectDestinationSafe(target, "https://example.com/login"));
        assertTrue(policyValidator.isRedirectDestinationSafe(target, "https://sub.example.com/login"));
        assertFalse(policyValidator.isRedirectDestinationSafe(target, "https://thirdparty.com/oauth"));
    }
}
