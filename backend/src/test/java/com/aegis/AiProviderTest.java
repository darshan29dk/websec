package com.aegis;

import com.aegis.ai.embedding.MockEmbeddingProvider;
import com.aegis.ai.provider.*;
import com.aegis.ai.service.SecretRedactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AiProviderTest {

    @Test
    @DisplayName("MockLlmProvider returns valid deterministic security analysis response")
    void testMockLlmProvider() {
        MockLlmProvider provider = new MockLlmProvider();
        assertTrue(provider.isAvailable());
        assertEquals("Mock-LLM-Provider", provider.getProviderName());

        LlmRequest request = new LlmRequest("System prompt", "Analyze SQL injection on /login with username parameter");
        LlmResponse response = provider.generate(request);

        assertTrue(response.isSuccess());
        assertNotNull(response.getContent());
        assertTrue(response.getContent().contains("VULNERABILITY_CONFIRMED") || response.getContent().contains("SQL injection"));
    }

    @Test
    @DisplayName("OpenAiCompatibleProvider handles unconfigured API key gracefully")
    void testOpenAiProviderUnconfigured() {
        OpenAiCompatibleProvider provider = new OpenAiCompatibleProvider("https://api.openai.com/v1", "", "gpt-4o", 60);
        assertFalse(provider.isAvailable());

        LlmResponse response = provider.generate(new LlmRequest("System", "User"));
        assertFalse(response.isSuccess());
        assertTrue(response.getErrorMessage().contains("not configured"));
    }

    @Test
    @DisplayName("SecretRedactionService redacts Bearer tokens, passwords, and session cookies")
    void testSecretRedaction() {
        SecretRedactionService redactionService = new SecretRedactionService();

        String raw = "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.testToken.secretPayload and password: \"mySuperSecret123\" Cookie: JSESSIONID=abc123456";
        String redacted = redactionService.redactSecrets(raw);

        assertFalse(redacted.contains("mySuperSecret123"));
        assertFalse(redacted.contains("abc123456"));
        assertTrue(redacted.contains("[REDACTED]"));
    }

    @Test
    @DisplayName("MockEmbeddingProvider generates consistent normalized vector")
    void testMockEmbeddingProvider() {
        MockEmbeddingProvider provider = new MockEmbeddingProvider(1536);
        assertEquals(1536, provider.getDimension());

        float[] v1 = provider.embed("SQL injection vulnerability");
        float[] v2 = provider.embed("SQL injection vulnerability");
        assertEquals(1536, v1.length);
        assertArrayEquals(v1, v2);
    }
}
