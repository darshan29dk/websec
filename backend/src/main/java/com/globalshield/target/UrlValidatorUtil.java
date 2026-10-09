package com.globalshield.target;

import com.globalshield.exception.InvalidTargetUrlException;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;

public class UrlValidatorUtil {

    private UrlValidatorUtil() {
        // utility class
    }

    public static String validateAndNormalizeUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new InvalidTargetUrlException("Target URL cannot be empty");
        }

        String trimmed = rawUrl.trim();

        // Check for disallowed protocol prefixes explicitly
        String lower = trimmed.toLowerCase();
        if (lower.startsWith("javascript:") || 
            lower.startsWith("file:") || 
            lower.startsWith("data:") || 
            lower.startsWith("ftp:") || 
            lower.startsWith("ssh:") || 
            lower.startsWith("gopher:") || 
            lower.startsWith("dict:") || 
            lower.startsWith("ldap:") ||
            lower.startsWith("blob:")) {
            throw new InvalidTargetUrlException("Unsupported or unsafe URI scheme in URL: " + rawUrl);
        }

        // Prepend https:// if no scheme is provided
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
            trimmed = "https://" + trimmed;
            lower = trimmed.toLowerCase();
        }

        try {
            URI uri = new URI(trimmed);
            
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new InvalidTargetUrlException("Only HTTP and HTTPS schemes are allowed");
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new InvalidTargetUrlException("Target URL must contain a valid hostname");
            }

            // Verify URL syntax using Java URL
            URL url = uri.toURL();

            // Normalize URL path
            String normalizedPath = uri.getPath();
            if (normalizedPath == null || normalizedPath.isEmpty()) {
                normalizedPath = "/";
            }

            // Build clean normalized URL string
            StringBuilder sb = new StringBuilder();
            sb.append(scheme.toLowerCase()).append("://").append(host.toLowerCase());
            
            if (uri.getPort() != -1 && uri.getPort() != 80 && uri.getPort() != 443) {
                sb.append(":").append(uri.getPort());
            }
            
            sb.append(normalizedPath);
            
            if (uri.getQuery() != null && !uri.getQuery().isEmpty()) {
                sb.append("?").append(uri.getQuery());
            }

            return sb.toString();

        } catch (URISyntaxException | IllegalArgumentException | java.net.MalformedURLException e) {
            throw new InvalidTargetUrlException("Target URL is syntactically invalid: " + rawUrl);
        }
    }
}
