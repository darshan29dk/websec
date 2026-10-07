package com.aegis.event;

import com.aegis.target.SecurityTarget;
import com.aegis.target.SecurityTargetRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class EventNormalizer {

    private final SecurityTargetRepository targetRepository;

    @Value("${aegis.lab-mode:true}")
    private boolean labModeEnabled;

    private static final Pattern AUTH_HEADER_PATTERN = Pattern.compile("(?i)(authorization:\\s*)(bearer|basic|digest)?\\s*[^\\r\\n]+");
    private static final Pattern COOKIE_PATTERN = Pattern.compile("(?i)(cookie:\\s*)[^\\r\\n]+");
    private static final Pattern SENSITIVE_PARAM_PATTERN = Pattern.compile("(?i)(password|passwd|secret|token|api_key|access_token)=[^&\\s]+");

    public EventNormalizer(SecurityTargetRepository targetRepository) {
        this.targetRepository = targetRepository;
    }

    public SecurityTarget validateTarget(UUID targetId) {
        if (targetId == null) {
            throw new IllegalArgumentException("Target ID cannot be null");
        }
        SecurityTarget target = targetRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("Target not found with ID: " + targetId));
        return target;
    }

    public SecurityEvent normalizeHttpEvent(HttpEventIngestRequest request, SecurityTarget target) {
        SecurityEvent event = new SecurityEvent();
        event.setTargetId(target.getId());
        event.setAssessmentId(request.getAssessmentId());

        String path = request.getPath() != null ? request.getPath() : "/";
        event.setPath(path);

        if (isSuspiciousPathOrMethod(path, request.getQueryString())) {
            event.setEventType(SecurityEventType.SUSPICIOUS_REQUEST);
        } else {
            event.setEventType(SecurityEventType.HTTP_REQUEST);
        }

        OffsetDateTime now = OffsetDateTime.now();
        event.setEventTime(request.getTimestamp() != null ? request.getTimestamp() : now);
        event.setObservedAt(now);

        // Strict Source IP Evidence rule
        if (StringUtils.hasText(request.getSourceIp())) {
            event.setSourceIp(request.getSourceIp().trim());
            event.setSourceIpConfidence(SourceIpConfidence.OBSERVED);
        } else {
            event.setSourceIp(null);
            event.setSourceIpConfidence(SourceIpConfidence.UNKNOWN);
        }

        event.setSourcePort(request.getSourcePort());
        event.setDestinationIp(request.getDestinationIp());
        event.setDestinationPort(request.getDestinationPort() != null ? request.getDestinationPort() : request.getPort());
        event.setHttpMethod(request.getMethod() != null ? request.getMethod().toUpperCase() : "GET");

        String scheme = request.getScheme() != null ? request.getScheme().toLowerCase() : "http";
        String host = request.getHost() != null ? request.getHost() : target.getPrimaryUrl();
        event.setUrl(scheme + "://" + host + (request.getPort() != null && request.getPort() != 80 && request.getPort() != 443 ? ":" + request.getPort() : "") + path);

        event.setQueryParameters(redactSensitiveContent(request.getQueryString()));
        event.setStatusCode(request.getStatusCode());
        event.setUserAgent(request.getUserAgent());
        event.setRequestSize(request.getContentLength());
        event.setProtocol(request.getScheme() != null ? request.getScheme().toUpperCase() : "HTTP");

        EventSource source = request.getEventSource();
        if (source == EventSource.LAB_SIMULATION && !labModeEnabled) {
            source = EventSource.MANUAL_IMPORT;
        }
        event.setEventSource(source != null ? source : EventSource.APPLICATION_LOG);

        event.setNormalizedData(String.format("Method: %s, Path: %s, SourceIP: %s (%s)",
                event.getHttpMethod(), event.getPath(),
                event.getSourceIp() != null ? event.getSourceIp() : "UNAVAILABLE",
                event.getSourceIpConfidence()));

        return event;
    }

    public HttpEvent buildHttpEvent(HttpEventIngestRequest request, SecurityEvent securityEvent) {
        HttpEvent httpEvent = new HttpEvent();
        httpEvent.setSecurityEventId(securityEvent.getId());
        httpEvent.setTargetId(securityEvent.getTargetId());
        httpEvent.setTimestamp(securityEvent.getEventTime());
        httpEvent.setSourceIp(securityEvent.getSourceIp());
        httpEvent.setMethod(securityEvent.getHttpMethod());
        httpEvent.setScheme(request.getScheme() != null ? request.getScheme().toLowerCase() : "http");
        httpEvent.setHost(request.getHost() != null ? request.getHost() : "localhost");
        httpEvent.setPort(request.getPort() != null ? request.getPort() : 80);
        httpEvent.setPath(securityEvent.getPath());
        httpEvent.setQueryString(redactSensitiveContent(request.getQueryString()));
        httpEvent.setStatusCode(request.getStatusCode());
        httpEvent.setRequestHeaders(redactSensitiveContent(request.getRequestHeaders()));
        httpEvent.setResponseHeaders(redactSensitiveContent(request.getResponseHeaders()));
        httpEvent.setRequestBodyReference(redactSensitiveContent(boundedString(request.getRequestBody(), 2000)));
        httpEvent.setResponseBodyReference(redactSensitiveContent(boundedString(request.getResponseBody(), 2000)));
        httpEvent.setUserAgent(request.getUserAgent());
        httpEvent.setContentType(request.getContentType());
        httpEvent.setContentLength(request.getContentLength());
        httpEvent.setTlsVersion(request.getTlsVersion());
        return httpEvent;
    }

    public SecurityEvent normalizeNetworkEvent(NetworkEventIngestRequest request, SecurityTarget target) {
        SecurityEvent event = new SecurityEvent();
        event.setTargetId(target.getId());
        event.setAssessmentId(request.getAssessmentId());
        event.setEventType(SecurityEventType.NETWORK_CONNECTION);

        OffsetDateTime now = OffsetDateTime.now();
        event.setEventTime(request.getTimestamp() != null ? request.getTimestamp() : now);
        event.setObservedAt(now);

        if (StringUtils.hasText(request.getSourceIp())) {
            event.setSourceIp(request.getSourceIp().trim());
            event.setSourceIpConfidence(SourceIpConfidence.OBSERVED);
        } else {
            event.setSourceIp(null);
            event.setSourceIpConfidence(SourceIpConfidence.UNKNOWN);
        }

        event.setSourcePort(request.getSourcePort());
        event.setDestinationIp(request.getDestinationIp());
        event.setDestinationPort(request.getDestinationPort());
        event.setProtocol(request.getProtocol() != null ? request.getProtocol().toUpperCase() : "TCP");

        EventSource source = request.getEventSource();
        if (source == EventSource.LAB_SIMULATION && !labModeEnabled) {
            source = EventSource.MANUAL_IMPORT;
        }
        event.setEventSource(source != null ? source : EventSource.NETWORK_SENSOR);

        event.setNormalizedData(String.format("Protocol: %s, SrcIP: %s, DstIP: %s, State: %s",
                event.getProtocol(),
                event.getSourceIp() != null ? event.getSourceIp() : "UNAVAILABLE",
                event.getDestinationIp() != null ? event.getDestinationIp() : "N/A",
                request.getConnectionState()));

        return event;
    }

    public NetworkEvent buildNetworkEvent(NetworkEventIngestRequest request, SecurityEvent securityEvent) {
        NetworkEvent netEvent = new NetworkEvent();
        netEvent.setSecurityEventId(securityEvent.getId());
        netEvent.setTargetId(securityEvent.getTargetId());
        netEvent.setTimestamp(securityEvent.getEventTime());
        netEvent.setSourceIp(securityEvent.getSourceIp());
        netEvent.setSourcePort(request.getSourcePort());
        netEvent.setDestinationIp(request.getDestinationIp());
        netEvent.setDestinationPort(request.getDestinationPort());
        netEvent.setProtocol(securityEvent.getProtocol());
        netEvent.setDirection(request.getDirection());
        netEvent.setBytesIn(request.getBytesIn());
        netEvent.setBytesOut(request.getBytesOut());
        netEvent.setConnectionState(request.getConnectionState());
        netEvent.setEventSource(securityEvent.getEventSource());
        return netEvent;
    }

    public String redactSensitiveContent(String input) {
        if (!StringUtils.hasText(input)) {
            return input;
        }
        String redacted = AUTH_HEADER_PATTERN.matcher(input).replaceAll("$1$2 [REDACTED]");
        redacted = COOKIE_PATTERN.matcher(redacted).replaceAll("$1[REDACTED]");
        redacted = SENSITIVE_PARAM_PATTERN.matcher(redacted).replaceAll("$1=[REDACTED]");
        return redacted;
    }

    private boolean isSuspiciousPathOrMethod(String path, String queryString) {
        if (path == null) return false;
        String lowerPath = path.toLowerCase();
        if (lowerPath.contains("..") || lowerPath.contains(".env") || lowerPath.contains("/actuator") || lowerPath.contains("/config")) {
            return true;
        }
        if (queryString != null && (queryString.toLowerCase().contains("union select") || queryString.toLowerCase().contains("<script"))) {
            return true;
        }
        return false;
    }

    private String boundedString(String str, int maxLen) {
        if (str == null) return null;
        if (str.length() <= maxLen) return str;
        return str.substring(0, maxLen) + "... [TRUNCATED]";
    }
}
