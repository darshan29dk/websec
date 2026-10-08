package com.globalshield.ai.embedding;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class MockEmbeddingProvider implements EmbeddingProvider {

    private final int dimension;

    public MockEmbeddingProvider() {
        this(1536);
    }

    public MockEmbeddingProvider(int dimension) {
        this.dimension = dimension > 0 ? dimension : 1536;
    }

    @Override
    public float[] embed(String text) {
        if (text == null) text = "";
        float[] vector = new float[dimension];

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));

            double norm = 0.0;
            for (int i = 0; i < dimension; i++) {
                byte b = hash[i % hash.length];
                float val = (float) (((b & 0xFF) / 255.0) * 2.0 - 1.0);
                vector[i] = val;
                norm += val * val;
            }

            norm = Math.sqrt(norm);
            if (norm > 0) {
                for (int i = 0; i < dimension; i++) {
                    vector[i] /= norm;
                }
            }
        } catch (Exception e) {
            for (int i = 0; i < dimension; i++) {
                vector[i] = (float) (1.0 / Math.sqrt(dimension));
            }
        }

        return vector;
    }

    @Override
    public int getDimension() {
        return dimension;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String getProviderName() {
        return "Mock-Embedding-Provider";
    }
}
