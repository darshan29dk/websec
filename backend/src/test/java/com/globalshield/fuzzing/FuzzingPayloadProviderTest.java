package com.globalshield.fuzzing;

import com.globalshield.fuzzing.entity.FuzzingProfile;
import com.globalshield.fuzzing.entity.OwaspCategory;
import com.globalshield.fuzzing.payload.FuzzingPayload;
import com.globalshield.fuzzing.payload.FuzzingPayloadProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class FuzzingPayloadProviderTest {

    private FuzzingPayloadProvider payloadProvider;

    @BeforeEach
    void setUp() {
        payloadProvider = new FuzzingPayloadProvider();
    }

    @Test
    void testActiveFuzzingSuppliesBoundedPayloads() {
        List<FuzzingPayload> payloads = payloadProvider.getPayloadsForProfile(
                FuzzingProfile.SAFE_ACTIVE_FUZZ,
                List.of("A01", "A03", "A05", "A07", "A10")
        );

        assertNotNull(payloads);
        assertFalse(payloads.isEmpty());

        // Verify non-destructive SQL syntax checks
        assertTrue(payloads.stream().anyMatch(p -> p.getPayloadType().contains("SQL_INJECTION")));

        // Verify XSS canary reflection
        assertTrue(payloads.stream().anyMatch(p -> p.getPayloadType().contains("XSS_REFLECTION_CANARY")));

        // Verify Path Traversal
        assertTrue(payloads.stream().anyMatch(p -> p.getPayloadType().contains("PATH_TRAVERSAL")));

        // Verify no destructive SQL commands exist
        for (FuzzingPayload p : payloads) {
            String val = p.getTestValue().toUpperCase();
            assertFalse(val.contains("DROP TABLE"), "Payloads must never contain destructive SQL DROP commands");
            assertFalse(val.contains("TRUNCATE"), "Payloads must never contain destructive SQL TRUNCATE commands");
            assertFalse(val.contains("DELETE FROM"), "Payloads must never contain destructive SQL DELETE commands");
        }
    }

    @Test
    void testPassiveBaselineFiltersOutMutations() {
        List<FuzzingPayload> payloads = payloadProvider.getPayloadsForProfile(
                FuzzingProfile.PASSIVE_BASELINE,
                List.of("A01", "A03", "A05")
        );

        // Passive baseline should only retain configuration and baseline inspection
        for (FuzzingPayload p : payloads) {
            assertTrue(
                    p.getPayloadType().contains("CONFIG") || p.getPayloadType().contains("BASELINE"),
                    "Passive baseline profile must only contain non-mutating checks"
            );
        }
    }
}
