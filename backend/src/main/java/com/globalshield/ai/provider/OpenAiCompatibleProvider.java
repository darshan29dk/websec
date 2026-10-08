package com.globalshield.ai.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

public class OpenAiCompatibleProvider implements LlmProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatibleProvider.class);

    private final String baseUrl;
    private final String apiKey;
    private final String model;
    private final int timeoutSeconds;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleProvider(String baseUrl, String apiKey, String model, int timeoutSeconds) {
        this.baseUrl = (baseUrl == null || baseUrl.isBlank()) ? "https://api.openai.com/v1" : baseUrl.replaceAll("/+$", "");
        this.apiKey = apiKey;
        this.model = (model == null || model.isBlank()) ? "gpt-4o" : model;
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 60;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public LlmResponse generate(LlmRequest request) {
        if (!isAvailable()) {
            return LlmResponse.failure(getProviderName(), model, "OpenAI-compatible provider is not configured with an API key.");
        }

        try {
            String endpoint = baseUrl + "/chat/completions";

            List<Map<String, String>> messages = new ArrayList<>();
            if (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank()) {
                messages.add(Map.of("role", "system", "content", request.getSystemPrompt()));
            }
            messages.add(Map.of("role", "user", "content", request.getUserPrompt()));

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", messages);
            body.put("temperature", request.getTemperature());
            body.put("max_tokens", request.getMaxTokens());

            if (request.isJsonMode()) {
                body.put("response_format", Map.of("type", "json_object"));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(endpoint, entity, Map.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map respBody = responseEntity.getBody();
                List choices = (List) respBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map firstChoice = (Map) choices.get(0);
                    Map message = (Map) firstChoice.get("message");
                    String content = (String) message.get("content");
                    
                    int tokens = 0;
                    Map usage = (Map) respBody.get("usage");
                    if (usage != null && usage.containsKey("total_tokens")) {
                        tokens = ((Number) usage.get("total_tokens")).intValue();
                    }

                    return LlmResponse.success(content, objectMapper.writeValueAsString(respBody), getProviderName(), model, tokens);
                }
            }

            return LlmResponse.failure(getProviderName(), model, "Empty response from LLM API endpoint: " + responseEntity.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to generate response from OpenAI-compatible provider", e);
            return LlmResponse.failure(getProviderName(), model, "LLM provider error: " + e.getMessage());
        }
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String getModel() {
        return model;
    }

    @Override
    public String getProviderName() {
        return "OpenAI-Compatible (" + baseUrl + ")";
    }

    @Override
    public LlmProviderType getProviderType() {
        return LlmProviderType.OPENAI;
    }
}
