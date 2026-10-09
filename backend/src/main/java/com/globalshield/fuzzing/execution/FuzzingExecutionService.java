package com.globalshield.fuzzing.execution;

import com.globalshield.fuzzing.entity.FuzzingTestCase;
import com.globalshield.fuzzing.policy.FuzzingPolicyValidator;
import com.globalshield.target.SecurityTarget;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FuzzingExecutionService {

    private static final Logger log = LoggerFactory.getLogger(FuzzingExecutionService.class);

    private final FuzzingPolicyValidator policyValidator;

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NEVER) // Enforce explicit redirect validation
            .build();

    @Getter
    @Builder
    public static class RawHttpResponse {
        private final int statusCode;
        private final long responseTimeMs;
        private final String sanitizedHeaders;
        private final String bodySnippet;
        private final String bodyHash;
        private final String rawHeaders;
        private final Map<String, String> extractedVariables;
    }

    public RawHttpResponse executeRequest(
            SecurityTarget target,
            String targetUrl,
            String httpMethod,
            String paramName,
            String payloadValue,
            String customHeadersJson,
            Map<String, String> sessionVariables,
            int timeoutMs
    ) throws Exception {
        // 1. Scope and SSRF validation
        policyValidator.validateEndpointScope(target, targetUrl);

        // 2. Prepare request URL and Body
        String finalUrl = buildUrlWithPayload(targetUrl, httpMethod, paramName, payloadValue, sessionVariables);
        String finalBody = buildBodyWithPayload(httpMethod, paramName, payloadValue, sessionVariables);

        HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                .uri(new URI(finalUrl))
                .timeout(Duration.ofMillis(timeoutMs));

        // Add User Agent and GlobalShield Headers
        reqBuilder.header("User-Agent", "GlobalShield-Security-Assessor/1.0 (Authorized Security Assessment)");
        reqBuilder.header("X-Security-Scanner", "GlobalShield");

        // Inject session cookies if present
        if (sessionVariables != null && sessionVariables.containsKey("Cookie")) {
            reqBuilder.header("Cookie", sessionVariables.get("Cookie"));
        }
        if (sessionVariables != null && sessionVariables.containsKey("Authorization")) {
            reqBuilder.header("Authorization", sessionVariables.get("Authorization"));
        }

        // Method & Body
        if ("POST".equalsIgnoreCase(httpMethod) || "PUT".equalsIgnoreCase(httpMethod) || "PATCH".equalsIgnoreCase(httpMethod)) {
            reqBuilder.header("Content-Type", "application/x-www-form-urlencoded");
            reqBuilder.method(httpMethod.toUpperCase(), HttpRequest.BodyPublishers.ofString(finalBody != null ? finalBody : ""));
        } else {
            reqBuilder.method(httpMethod != null ? httpMethod.toUpperCase() : "GET", HttpRequest.BodyPublishers.noBody());
        }

        Instant start = Instant.now();
        HttpResponse<String> response = HTTP_CLIENT.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        long durationMs = Duration.between(start, Instant.now()).toMillis();

        // Check for redirects and validate destination scope
        if (response.statusCode() >= 300 && response.statusCode() < 400) {
            Optional<String> locationOpt = response.headers().firstValue("Location");
            if (locationOpt.isPresent()) {
                String redirectLoc = locationOpt.get();
                if (!redirectLoc.startsWith("http://") && !redirectLoc.startsWith("https://")) {
                    URI baseUri = new URI(targetUrl);
                    redirectLoc = baseUri.resolve(redirectLoc).toString();
                }
                if (!policyValidator.isRedirectDestinationSafe(target, redirectLoc)) {
                    log.warn("Blocked redirect to out-of-scope destination: {}", redirectLoc);
                    throw new SecurityException("Redirect destination escapes authorized target scope: " + redirectLoc);
                }
            }
        }

        String rawBody = response.body() != null ? response.body() : "";
        String snippet = rawBody.length() > 4096 ? rawBody.substring(0, 4096) + "\n...[TRUNCATED]" : rawBody;
        String bodyHash = sha256Hex(rawBody);

        StringBuilder headersBuilder = new StringBuilder();
        StringBuilder rawHeadersBuilder = new StringBuilder();
        Map<String, String> extracted = new HashMap<>();

        response.headers().map().forEach((k, vals) -> {
            String valStr = String.join(", ", vals);
            rawHeadersBuilder.append(k).append(": ").append(valStr).append("\n");

            // Sanitize sensitive headers
            if (k.equalsIgnoreCase("Set-Cookie") || k.equalsIgnoreCase("Authorization")) {
                headersBuilder.append(k).append(": [REDACTED]\n");
            } else {
                headersBuilder.append(k).append(": ").append(valStr).append("\n");
            }

            // Extract session cookies for multi-step sequences
            if (k.equalsIgnoreCase("Set-Cookie")) {
                String cookieHeader = vals.get(0).split(";")[0];
                extracted.put("Cookie", cookieHeader);
            }
        });

        // Extract JSON tokens if present
        extractJsonTokens(rawBody, extracted);

        return RawHttpResponse.builder()
                .statusCode(response.statusCode())
                .responseTimeMs(durationMs)
                .sanitizedHeaders(headersBuilder.toString().trim())
                .bodySnippet(snippet)
                .bodyHash(bodyHash)
                .rawHeaders(rawHeadersBuilder.toString().trim())
                .extractedVariables(extracted)
                .build();
    }

    private String buildUrlWithPayload(String targetUrl, String httpMethod, String paramName, String payload, Map<String, String> sessionVars) {
        if (!"GET".equalsIgnoreCase(httpMethod) || paramName == null || paramName.isBlank() || payload == null) {
            return targetUrl;
        }

        String encodedVal = URLEncoder.encode(payload, StandardCharsets.UTF_8);
        if (targetUrl.contains("?")) {
            return targetUrl + "&" + paramName + "=" + encodedVal;
        } else {
            return targetUrl + "?" + paramName + "=" + encodedVal;
        }
    }

    private String buildBodyWithPayload(String httpMethod, String paramName, String payload, Map<String, String> sessionVars) {
        if ("GET".equalsIgnoreCase(httpMethod) || paramName == null || paramName.isBlank()) {
            return payload != null ? payload : "";
        }
        return paramName + "=" + URLEncoder.encode(payload != null ? payload : "", StandardCharsets.UTF_8);
    }

    private void extractJsonTokens(String body, Map<String, String> extracted) {
        if (body == null || body.isBlank() || !body.trim().startsWith("{")) return;
        Pattern tokenPat = Pattern.compile("\"(token|access_token|jwt|token_id)\"\\s*:\\s*\"([^\"]+)\"");
        Matcher m = tokenPat.matcher(body);
        if (m.find()) {
            extracted.put("Authorization", "Bearer " + m.group(2));
        }
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
