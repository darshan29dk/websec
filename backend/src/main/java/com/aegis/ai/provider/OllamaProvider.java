package com.aegis.ai.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

public class OllamaProvider implements LlmProvider {

    private static final Logger log = LoggerFactory.getLogger(OllamaProvider.class);

    private final String baseUrl;
    private final String model;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OllamaProvider(String baseUrl, String model) {
        this.baseUrl = (baseUrl == null || baseUrl.isBlank()) ? "http://localhost:11434" : baseUrl.replaceAll("/+$", "");
        this.model = (model == null || model.isBlank()) ? "llama3" : model;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public LlmResponse generate(LlmRequest request) {
        try {
            String endpoint = baseUrl + "/api/chat";

            List<Map<String, String>> messages = new ArrayList<>();
            if (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank()) {
                messages.add(Map.of("role", "system", "content", request.getSystemPrompt()));
            }
            messages.add(Map.of("role", "user", "content", request.getUserPrompt()));

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", messages);
            body.put("stream", false);
            if (request.isJsonMode()) {
                body.put("format", "json");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(endpoint, entity, Map.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map respBody = responseEntity.getBody();
                Map message = (Map) respBody.get("message");
                if (message != null && message.containsKey("content")) {
                    String content = (String) message.get("content");
                    int tokens = respBody.containsKey("eval_count") ? ((Number) respBody.get("eval_count")).intValue() : 0;
                    return LlmResponse.success(content, objectMapper.writeValueAsString(respBody), getProviderName(), model, tokens);
                }
            }

            return LlmResponse.failure(getProviderName(), model, "Ollama request failed with status: " + responseEntity.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to generate response from Ollama provider", e);
            return LlmResponse.failure(getProviderName(), model, "Ollama provider error: " + e.getMessage());
        }
    }

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
    public String getModel() {
        return model;
    }

    @Override
    public String getProviderName() {
        return "Ollama (" + baseUrl + ")";
    }

    @Override
    public LlmProviderType getProviderType() {
        return LlmProviderType.OLLAMA;
    }
}
