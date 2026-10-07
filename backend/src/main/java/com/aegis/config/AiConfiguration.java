package com.aegis.config;

import com.aegis.ai.embedding.*;
import com.aegis.ai.provider.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfiguration {

    @Value("${aegis.ai.enabled:true}")
    private boolean enabled;

    @Value("${aegis.ai.provider:mock}")
    private String provider;

    @Value("${aegis.ai.model:gpt-4o}")
    private String model;

    @Value("${aegis.ai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${aegis.ai.api-key:}")
    private String apiKey;

    @Value("${aegis.ai.ollama-base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${aegis.ai.ollama-model:llama3}")
    private String ollamaModel;

    @Value("${aegis.ai.timeout-seconds:60}")
    private int timeoutSeconds;

    @Value("${aegis.ai.embedding-provider:mock}")
    private String embeddingProvider;

    @Value("${aegis.ai.embedding-model:text-embedding-3-small}")
    private String embeddingModel;

    @Value("${aegis.ai.embedding-dimension:1536}")
    private int embeddingDimension;

    @Bean
    public LlmProvider llmProvider() {
        if (!enabled || "disabled".equalsIgnoreCase(provider)) {
            return new LlmProvider() {
                @Override
                public LlmResponse generate(LlmRequest request) {
                    return LlmResponse.failure("Disabled", "none", "AI analysis is disabled.");
                }

                @Override
                public boolean isAvailable() { return false; }

                @Override
                public String getModel() { return "disabled"; }

                @Override
                public String getProviderName() { return "Disabled"; }

                @Override
                public LlmProviderType getProviderType() { return LlmProviderType.DISABLED; }
            };
        }

        if ("openai".equalsIgnoreCase(provider)) {
            return new OpenAiCompatibleProvider(baseUrl, apiKey, model, timeoutSeconds);
        } else if ("ollama".equalsIgnoreCase(provider)) {
            return new OllamaProvider(ollamaBaseUrl, ollamaModel);
        } else {
            return new MockLlmProvider(model);
        }
    }

    @Bean
    public EmbeddingProvider embeddingProvider() {
        if ("openai".equalsIgnoreCase(embeddingProvider)) {
            return new OpenAiEmbeddingProvider(baseUrl, apiKey, embeddingModel, embeddingDimension);
        } else if ("ollama".equalsIgnoreCase(embeddingProvider)) {
            return new OllamaEmbeddingProvider(ollamaBaseUrl, embeddingModel, embeddingDimension);
        } else {
            return new MockEmbeddingProvider(embeddingDimension);
        }
    }
}
