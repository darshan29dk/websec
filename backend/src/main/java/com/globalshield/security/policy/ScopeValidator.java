package com.globalshield.security.policy;

import com.globalshield.exception.BadRequestException;
import com.globalshield.target.SecurityTarget;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
@RequiredArgsConstructor
public class ScopeValidator {

    private static final Logger log = LoggerFactory.getLogger(ScopeValidator.class);

    private final TargetNetworkPolicy networkPolicy;

    /**
     * Validates that target has valid URL and conforms to SSRF and scope boundaries.
     */
    public void validateScope(SecurityTarget target) {
        if (target == null) {
            throw new BadRequestException("Target cannot be null for scope validation");
        }

        if (target.getPrimaryUrl() == null || target.getPrimaryUrl().isBlank()) {
            throw new BadRequestException("Target primary URL is required for scope validation");
        }

        // Run target network policy SSRF checks
        networkPolicy.validateTargetNetworkAccess(target);

        log.debug("Scope validation passed for target: {} ({})", target.getName(), target.getPrimaryUrl());
    }

    /**
     * Validates that a discovered asset or endpoint belongs to the authorized target scope.
     */
    public boolean isInScope(SecurityTarget target, String candidateHostOrUrl) {
        if (candidateHostOrUrl == null || candidateHostOrUrl.isBlank() || target == null) {
            return false;
        }

        try {
            String targetHost = extractHost(target.getPrimaryUrl());
            String candidateHost = candidateHostOrUrl.contains("://") 
                    ? extractHost(candidateHostOrUrl) 
                    : candidateHostOrUrl.split(":")[0].trim();

            if (targetHost.equalsIgnoreCase(candidateHost)) {
                return true;
            }

            // Subdomain scope check
            return candidateHost.toLowerCase().endsWith("." + targetHost.toLowerCase());
        } catch (Exception e) {
            log.warn("Failed to verify if {} is in scope for target {}", candidateHostOrUrl, target.getName());
            return false;
        }
    }

    private String extractHost(String rawUrl) {
        try {
            URI uri = new URI(rawUrl);
            String host = uri.getHost();
            return host != null ? host.toLowerCase() : "";
        } catch (Exception e) {
            return "";
        }
    }
}
