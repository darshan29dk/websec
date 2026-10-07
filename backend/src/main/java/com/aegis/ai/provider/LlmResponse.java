package com.aegis.ai.provider;

public class LlmResponse {
    private String content;
    private String rawResponse;
    private String provider;
    private String model;
    private int tokensUsed;
    private boolean success;
    private String errorMessage;

    public LlmResponse() {}

    public static LlmResponse success(String content, String rawResponse, String provider, String model, int tokensUsed) {
        LlmResponse response = new LlmResponse();
        response.content = content;
        response.rawResponse = rawResponse;
        response.provider = provider;
        response.model = model;
        response.tokensUsed = tokensUsed;
        response.success = true;
        return response;
    }

    public static LlmResponse failure(String provider, String model, String errorMessage) {
        LlmResponse response = new LlmResponse();
        response.provider = provider;
        response.model = model;
        response.errorMessage = errorMessage;
        response.success = false;
        return response;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getRawResponse() { return rawResponse; }
    public void setRawResponse(String rawResponse) { this.rawResponse = rawResponse; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public int getTokensUsed() { return tokensUsed; }
    public void setTokensUsed(int tokensUsed) { this.tokensUsed = tokensUsed; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
