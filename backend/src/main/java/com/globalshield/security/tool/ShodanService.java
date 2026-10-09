package com.globalshield.security.tool;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

@Service
public class ShodanService {

    private static final Logger log = LoggerFactory.getLogger(ShodanService.class);

    @Value("${security.tools.shodan.api-key:${SHODAN_API_KEY:}}")
    private String shodanApiKey;

    private final RestTemplate restTemplate;

    public ShodanService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isConfigured() {
        return shodanApiKey != null && !shodanApiKey.isBlank() && !shodanApiKey.equalsIgnoreCase("placeholder");
    }

    public boolean checkApiAvailability() {
        if (!isConfigured()) {
            return false;
        }
        try {
            String url = "https://api.shodan.io/api-info?key=" + shodanApiKey;
            ResponseEntity<Map> res = restTemplate.getForEntity(url, Map.class);
            return res.getStatusCode().is2xxSuccessful() && res.getBody() != null;
        } catch (Exception e) {
            log.warn("Shodan API availability check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Looks up external intelligence for target IP.
     */
    public Map<String, Object> lookupHost(String ipAddress) {
        if (!isConfigured()) {
            return Map.of("error", "Shodan API key is not configured");
        }

        try {
            String url = "https://api.shodan.io/shodan/host/" + ipAddress + "?key=" + shodanApiKey;
            ResponseEntity<Map> res = restTemplate.getForEntity(url, Map.class);
            if (res.getStatusCode().is2xxSuccessful() && res.getBody() != null) {
                return (Map<String, Object>) res.getBody();
            }
        } catch (Exception e) {
            log.warn("Shodan host lookup failed for IP {}: {}", ipAddress, e.getMessage());
        }
        return Map.of("status", "NO_DATA", "query", ipAddress);
    }
}
