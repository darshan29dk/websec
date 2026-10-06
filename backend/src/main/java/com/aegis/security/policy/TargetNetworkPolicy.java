package com.aegis.security.policy;

import com.aegis.exception.BadRequestException;
import com.aegis.target.AuthorizationType;
import com.aegis.target.SecurityTarget;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

@Component
public class TargetNetworkPolicy {

    private static final Logger log = LoggerFactory.getLogger(TargetNetworkPolicy.class);

    private final boolean labMode;

    public TargetNetworkPolicy(@Value("${aegis.security.lab-mode:false}") boolean labMode) {
        this.labMode = labMode;
    }

    public void validateTargetNetworkAccess(SecurityTarget target) {
        if (target == null || target.getPrimaryUrl() == null) {
            throw new BadRequestException("Target URL cannot be null");
        }

        String rawUrl = target.getPrimaryUrl();
        try {
            URI uri = new URI(rawUrl);
            String host = uri.getHost();

            if (host == null || host.isBlank()) {
                throw new BadRequestException("Invalid hostname in target URL: " + rawUrl);
            }

            // Check explicit hostname strings
            String lowerHost = host.toLowerCase();
            if (isBlockedHostString(lowerHost)) {
                checkLabModeOverride(target, lowerHost);
                return;
            }

            // Resolve IP addresses to prevent SSRF and DNS rebinding to internal ranges
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress addr : addresses) {
                if (isPrivateOrLocalAddress(addr)) {
                    checkLabModeOverride(target, addr.getHostAddress());
                }
            }

        } catch (UnknownHostException e) {
            log.warn("Target host could not be resolved: {}", rawUrl);
            // Allow domain to proceed if unresolvable during dry-run validation, but flag
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception e) {
            throw new BadRequestException("Invalid target URL syntax: " + rawUrl);
        }
    }

    private boolean isBlockedHostString(String host) {
        return host.equals("localhost") ||
               host.equals("127.0.0.1") ||
               host.equals("0.0.0.0") ||
               host.equals("::1") ||
               host.equals("169.254.169.254") ||
               host.endsWith(".local") ||
               host.endsWith(".internal");
    }

    private boolean isPrivateOrLocalAddress(InetAddress addr) {
        if (addr.isLoopbackAddress() || addr.isAnyLocalAddress() || addr.isLinkLocalAddress() || addr.isSiteLocalAddress()) {
            return true;
        }

        byte[] bytes = addr.getAddress();

        // IPv4 10.0.0.0/8
        if (bytes.length == 4 && (bytes[0] & 0xFF) == 10) {
            return true;
        }
        // IPv4 172.16.0.0/12
        if (bytes.length == 4 && (bytes[0] & 0xFF) == 172 && (bytes[1] & 0xFF) >= 16 && (bytes[1] & 0xFF) <= 31) {
            return true;
        }
        // IPv4 192.168.0.0/16
        if (bytes.length == 4 && (bytes[0] & 0xFF) == 192 && (bytes[1] & 0xFF) == 168) {
            return true;
        }
        // AWS / Cloud metadata 169.254.169.254
        if (bytes.length == 4 && (bytes[0] & 0xFF) == 169 && (bytes[1] & 0xFF) == 254) {
            return true;
        }

        return false;
    }

    private void checkLabModeOverride(SecurityTarget target, String hostOrIp) {
        if (labMode) {
            boolean hasLabAuth = target.getAuthorizations() != null && target.getAuthorizations().stream()
                    .anyMatch(a -> a.getAuthorizationType() == AuthorizationType.LAB || a.getAuthorizationType() == AuthorizationType.OWNER);
            if (hasLabAuth) {
                log.info("Lab mode active: Allowed local target '{}' for target ID {}", hostOrIp, target.getId());
                return;
            }
        }

        throw new BadRequestException(
                "SSRF Protection Policy Violation: Destination address '" + hostOrIp +
                "' resolves to a private, loopback, or cloud metadata network. Access blocked."
        );
    }

    public boolean isLabMode() {
        return labMode;
    }
}
