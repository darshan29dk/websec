package com.globalshield.security.policy;

import com.globalshield.assessment.AssessmentProfile;
import com.globalshield.assessment.ProfileType;
import com.globalshield.exception.BadRequestException;
import com.globalshield.target.SecurityTarget;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class ToolPolicyValidator {

    private static final Logger log = LoggerFactory.getLogger(ToolPolicyValidator.class);

    private static final Set<String> PASSIVE_ALLOWED_TOOLS = Set.of(
            "Shodan", "theHarvester", "HttpSecurity", "Subfinder"
    );

    private static final Set<String> HIGH_RISK_TOOLS = Set.of(
            "SQLmap"
    );

    /**
     * Validates that the requested tool is permissible under the active profile and policy.
     */
    public void validateToolExecutionPolicy(String toolName, AssessmentProfile profile, SecurityTarget target) {
        if (toolName == null || toolName.isBlank()) {
            throw new BadRequestException("Tool name cannot be empty for policy validation");
        }

        ProfileType profileType = profile != null ? profile.getProfileType() : ProfileType.STANDARD_AUTHORIZED;

        // If PASSIVE profile, block active scanners
        if (profileType == ProfileType.PASSIVE) {
            boolean isPassive = PASSIVE_ALLOWED_TOOLS.stream().anyMatch(t -> t.equalsIgnoreCase(toolName));
            if (!isPassive) {
                throw new BadRequestException("Tool " + toolName + " is an active scanner and cannot be executed under a PASSIVE profile.");
            }
        }

        // If HIGH_RISK tool like SQLmap, enforce strict gating
        if (HIGH_RISK_TOOLS.stream().anyMatch(t -> t.equalsIgnoreCase(toolName))) {
            if (profileType != ProfileType.COMPREHENSIVE_AUTHORIZED) {
                throw new BadRequestException("High-risk tool " + toolName + " is strictly prohibited under " + profileType + " profile. Requires COMPREHENSIVE_AUTHORIZED with explicit consent.");
            }

            // Ensure target is active and authorized
            if (target == null || target.getAuthorizations() == null || target.getAuthorizations().isEmpty()) {
                throw new BadRequestException("High-risk tool " + toolName + " cannot be executed without valid active target authorization.");
            }
        }

        log.debug("Tool policy validation passed for tool: {} under profile: {}", toolName, profileType);
    }
}
