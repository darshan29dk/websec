package com.globalshield;

import com.globalshield.exception.BadRequestException;
import com.globalshield.security.policy.TargetNetworkPolicy;
import com.globalshield.target.AuthorizationType;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.TargetAuthorization;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TargetNetworkPolicyTest {

    private TargetNetworkPolicy policy;

    @BeforeEach
    void setUp() {
        policy = new TargetNetworkPolicy(false);
    }

    @Test
    void testPublicTargetUrlAllowed() {
        SecurityTarget target = SecurityTarget.builder()
                .primaryUrl("https://example.com")
                .authorizations(List.of(TargetAuthorization.builder()
                        .authorizationType(AuthorizationType.WRITTEN_PERMISSION)
                        .build()))
                .build();

        assertDoesNotThrow(() -> policy.validateTargetNetworkAccess(target));
    }

    @Test
    void testLoopbackUrlBlockedInNormalMode() {
        SecurityTarget target = SecurityTarget.builder()
                .primaryUrl("http://127.0.0.1:8080")
                .build();

        assertThrows(BadRequestException.class, () -> policy.validateTargetNetworkAccess(target));
    }

    @Test
    void testPrivateSubnetBlockedInNormalMode() {
        SecurityTarget target = SecurityTarget.builder()
                .primaryUrl("http://192.168.1.50")
                .build();

        assertThrows(BadRequestException.class, () -> policy.validateTargetNetworkAccess(target));
    }

    @Test
    void testMetadataEndpointBlockedInNormalMode() {
        SecurityTarget target = SecurityTarget.builder()
                .primaryUrl("http://169.254.169.254/latest/meta-data/")
                .build();

        assertThrows(BadRequestException.class, () -> policy.validateTargetNetworkAccess(target));
    }
}
