package com.globalshield.security.policy;

import com.globalshield.exception.BadRequestException;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.TargetStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class AuthorizationValidator {

    private static final Logger log = LoggerFactory.getLogger(AuthorizationValidator.class);

    /**
     * Validates that target has registered, confirmed, non-expired authorization.
     */
    public void validateAuthorization(SecurityTarget target) {
        if (target == null) {
            throw new BadRequestException("Target cannot be null for authorization validation");
        }

        if (target.getStatus() != TargetStatus.ACTIVE) {
            throw new BadRequestException("Target " + target.getName() + " is inactive. Only active targets may be assessed.");
        }

        if (target.getAuthorizations() == null || target.getAuthorizations().isEmpty()) {
            throw new BadRequestException("Target " + target.getName() + " has no security assessment authorization on record.");
        }

        boolean hasValidAuth = target.getAuthorizations().stream()
                .anyMatch(auth -> {
                    LocalDate now = LocalDate.now();
                    boolean dateValid = (auth.getAuthorizationDate() == null || !auth.getAuthorizationDate().isAfter(now))
                            && (auth.getExpirationDate() == null || !auth.getExpirationDate().isBefore(now));
                    return dateValid;
                });

        if (!hasValidAuth) {
            throw new BadRequestException("Authorization for target " + target.getName() + " has expired or is not yet active.");
        }

        log.debug("Authorization validated for target: {}", target.getName());
    }
}
