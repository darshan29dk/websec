package com.aegis.ai.embedding;

public interface EmbeddingProvider {
    float[] embed(String text);
    int getDimension();
    boolean isAvailable();
    String getProviderName();
}
