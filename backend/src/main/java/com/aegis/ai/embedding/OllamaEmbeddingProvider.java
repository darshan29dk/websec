package com.aegis.ai.embedding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

public class OllamaEmbeddingProvider implements EmbeddingProvider {

    private static final Logger log = LoggerFactory.getLogger(OllamaEmbeddingProvider.class);

    private final String baseUrl;
    private final String model;
    private final int dimension;
    private final RestTemplate restTemplate;

    public OllamaEmbeddingProvider(String baseUrl, String model, int dimension) {
        this.baseUrl = (baseUrl == null || baseUrl.isBlank()) ? "http://localhost:11434" : baseUrl.replaceAll("/+$", "");
        this.model = (model == null || model.isBlank()) ? "nomic-embed-text" : model;
        this.dimension = dimension > 0 ? dimension : 1536;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public float[] embed(String text) {
        try {
            String endpoint = baseUrl + "/api/embeddings";

            Map<String, Object> body = Map.of(
                "model", model,
                "prompt", text
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List embeddingList = (List) response.getBody().get("embedding");
                if (embeddingList != null) {
                    float[] result = new float[embeddingList.size()];
                    for (int i = 0; i < embeddingList.size(); i++) {
                        result[i] = ((Number) embeddingList.get(i)).floatValue();
                    }
                    return result;
                }
            }
        } catch (Exception e) {
            log.error("Failed to generate Ollama embedding, falling back to mock vector", e);
        }

        return new MockEmbeddingProvider(dimension).embed(text);
    }

    @Override
    public int getDimension() { return dimension; }

    @Override
    public boolean isAvailable() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(baseUrl + "/api/version", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getProviderName() { return "Ollama-Embedding (" + model + ")"; }
}
