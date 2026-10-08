package com.globalshield.ai.embedding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

public class OpenAiEmbeddingProvider implements EmbeddingProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiEmbeddingProvider.class);

    private final String baseUrl;
    private final String apiKey;
    private final String model;
    private final int dimension;
    private final RestTemplate restTemplate;

    public OpenAiEmbeddingProvider(String baseUrl, String apiKey, String model, int dimension) {
        this.baseUrl = (baseUrl == null || baseUrl.isBlank()) ? "https://api.openai.com/v1" : baseUrl.replaceAll("/+$", "");
        this.apiKey = apiKey;
        this.model = (model == null || model.isBlank()) ? "text-embedding-3-small" : model;
        this.dimension = dimension > 0 ? dimension : 1536;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public float[] embed(String text) {
        if (!isAvailable()) {
            return new MockEmbeddingProvider(dimension).embed(text);
        }

        try {
            String endpoint = baseUrl + "/embeddings";

            Map<String, Object> body = Map.of(
                "model", model,
                "input", text
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List data = (List) response.getBody().get("data");
                if (data != null && !data.isEmpty()) {
                    Map first = (Map) data.get(0);
                    List embeddingList = (List) first.get("embedding");
                    float[] result = new float[embeddingList.size()];
                    for (int i = 0; i < embeddingList.size(); i++) {
                        result[i] = ((Number) embeddingList.get(i)).floatValue();
                    }
                    return result;
                }
            }
        } catch (Exception e) {
            log.error("Failed to generate OpenAI embedding, falling back to mock vector", e);
        }

        return new MockEmbeddingProvider(dimension).embed(text);
    }

    @Override
    public int getDimension() { return dimension; }

    @Override
    public boolean isAvailable() { return apiKey != null && !apiKey.isBlank(); }

    @Override
    public String getProviderName() { return "OpenAI-Embedding (" + model + ")"; }
}
