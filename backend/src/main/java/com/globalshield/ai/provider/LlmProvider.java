package com.globalshield.ai.provider;

public interface LlmProvider {
    LlmResponse generate(LlmRequest request);
    boolean isAvailable();
    String getModel();
    String getProviderName();
    LlmProviderType getProviderType();
}
