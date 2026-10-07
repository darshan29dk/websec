package com.aegis.ai.service;

import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class SecretRedactionService {

    private static final Pattern BEARER_TOKEN = Pattern.compile("(?i)(Bearer\\s+)[A-Za-z0-9\\-\\._~\\+/=]+");
    private static final Pattern JWT_PATTERN = Pattern.compile("ey[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+");
    private static final Pattern PASSWORD_FIELD = Pattern.compile("(?i)(\"?(password|pass|secret|apiKey|api_key|token)\"?\\s*[:=]\\s*\")[^\"]+(\")");
    private static final Pattern COOKIE_SESSION = Pattern.compile("(?i)(JSESSIONID|session|PHPSESSID|connect\\.sid)=[^;\\s]+");
    private static final Pattern BASIC_AUTH = Pattern.compile("(?i)(Basic\\s+)[A-Za-z0-9+/=]+");

    public String redactSecrets(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        String result = BEARER_TOKEN.matcher(input).replaceAll("$1[REDACTED]");
        result = JWT_PATTERN.matcher(result).replaceAll("[REDACTED_JWT_TOKEN]");
        result = PASSWORD_FIELD.matcher(result).replaceAll("$1[REDACTED]$3");
        result = COOKIE_SESSION.matcher(result).replaceAll("$1=[REDACTED]");
        result = BASIC_AUTH.matcher(result).replaceAll("$1[REDACTED]");

        return result;
    }
}
