package com.globalshield.fuzzing.policy;

import com.globalshield.exception.BadRequestException;
import com.globalshield.fuzzing.dto.CreateFuzzingCampaignRequest;
import com.globalshield.security.policy.AuthorizationValidator;
import com.globalshield.security.policy.ScopeValidator;
import com.globalshield.security.policy.TargetNetworkPolicy;
import com.globalshield.target.SecurityTarget;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
@RequiredArgsConstructor
public class FuzzingPolicyValidator {

    private static final Logger log = LoggerFactory.getLogger(FuzzingPolicyValidator.class);

    private final TargetNetworkPolicy networkPolicy;
    private final ScopeValidator scopeValidator;
    private final AuthorizationValidator authorizationValidator;

    public void validateCampaignPolicy(SecurityTarget target, CreateFuzzingCampaignRequest request) {
        if (target == null) {
            throw new BadRequestException("Target cannot be null for fuzzing campaign");
        }

        // 1. Authorization validation (must have active, unexpired authorization)
        authorizationValidator.validateAuthorization(target);

        // 2. Scope & SSRF boundary validation
        scopeValidator.validateScope(target);

        // 3. Rate limits and guardrails
        if (request.getRateLimitRps() != null && (request.getRateLimitRps() < 1 || request.getRateLimitRps() > 50)) {
            throw new BadRequestException("Rate limit must be between 1 and 50 requests per second");
        }

        if (request.getMaxRequests() != null && (request.getMaxRequests() < 5 || request.getMaxRequests() > 500)) {
            throw new BadRequestException("Max requests limit must be between 5 and 500 requests per campaign");
        }

        if (request.getTimeoutMs() != null && (request.getTimeoutMs() < 1000 || request.getTimeoutMs() > 30000)) {
            throw new BadRequestException("Timeout must be between 1,000ms and 30,000ms");
        }

        log.info("Fuzzing policy validation passed for target: {} ({})", target.getName(), target.getPrimaryUrl());
    }

    public void validateEndpointScope(SecurityTarget target, String candidateUrl) {
        if (candidateUrl == null || candidateUrl.isBlank()) {
            throw new BadRequestException("Endpoint URL cannot be empty");
        }

        try {
            URI uri = new URI(candidateUrl);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new BadRequestException("Only HTTP and HTTPS protocols are permitted for fuzzing: " + candidateUrl);
            }

            if (!scopeValidator.isInScope(target, candidateUrl)) {
                throw new BadRequestException("Endpoint is outside authorized scope for target " + target.getName() + ": " + candidateUrl);
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Invalid endpoint URL syntax: " + candidateUrl);
        }
    }

    public boolean isRedirectDestinationSafe(SecurityTarget target, String redirectUrl) {
        try {
            URI uri = new URI(redirectUrl);
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return false;
            }
            return scopeValidator.isInScope(target, redirectUrl);
        } catch (Exception e) {
            return false;
        }
    }
}
