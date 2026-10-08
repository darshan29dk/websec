package com.globalshield.detection;

import com.globalshield.event.HttpEvent;
import com.globalshield.event.NetworkEvent;
import com.globalshield.event.SecurityEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class DetectionEngine {

    private static final Logger log = LoggerFactory.getLogger(DetectionEngine.class);

    private final DetectionRuleRepository ruleRepository;
    private final DetectionMatchRepository matchRepository;
    private final ObjectMapper objectMapper;
    private final DetectionEventListener eventListener;

    public interface DetectionEventListener {
        void onDetectionMatch(DetectionMatch match, SecurityEvent securityEvent);
    }

    public DetectionEngine(DetectionRuleRepository ruleRepository,
                           DetectionMatchRepository matchRepository,
                           ObjectMapper objectMapper,
                           @Lazy DetectionEventListener eventListener) {
        this.ruleRepository = ruleRepository;
        this.matchRepository = matchRepository;
        this.objectMapper = objectMapper;
        this.eventListener = eventListener;
    }

    @Transactional
    public List<DetectionMatch> evaluateEvent(SecurityEvent securityEvent, HttpEvent httpEvent, NetworkEvent networkEvent) {
        List<DetectionMatch> matches = new ArrayList<>();
        List<DetectionRule> rules = ruleRepository.findByEnabledTrue();

        for (DetectionRule rule : rules) {
            try {
                boolean isMatch = checkRuleMatch(rule, securityEvent, httpEvent, networkEvent);
                if (isMatch) {
                    DetectionMatch match = new DetectionMatch();
                    match.setRuleId(rule.getId());
                    match.setTargetId(securityEvent.getTargetId());
                    match.setEventId(securityEvent.getId());
                    match.setSeverity(rule.getSeverity());
                    match.setConfidence(rule.getConfidence());
                    match.setMatchedAt(OffsetDateTime.now());
                    match.setEvidence(buildEvidenceString(rule, securityEvent, httpEvent));
                    match.setStatus(MatchStatus.OPEN);

                    DetectionMatch savedMatch = matchRepository.save(match);
                    matches.add(savedMatch);

                    log.info("Detection rule '{}' MATCHED on event ID: {}", rule.getName(), securityEvent.getId());

                    if (eventListener != null) {
                        eventListener.onDetectionMatch(savedMatch, securityEvent);
                    }
                }
            } catch (Exception e) {
                log.error("Error evaluating detection rule '{}' on event {}: {}", rule.getName(), securityEvent.getId(), e.getMessage());
            }
        }
        return matches;
    }

    private boolean checkRuleMatch(DetectionRule rule, SecurityEvent securityEvent, HttpEvent httpEvent, NetworkEvent networkEvent) throws Exception {
        if (rule.getConditions() == null) {
            return false;
        }

        JsonNode condNode = objectMapper.readTree(rule.getConditions());
        String type = condNode.has("type") ? condNode.get("type").asText() : "";

        if ("REGEX_MATCH".equals(type)) {
            if (httpEvent == null && securityEvent == null) return false;
            JsonNode patternsNode = condNode.get("patterns");
            JsonNode fieldsNode = condNode.get("target_fields");
            if (patternsNode == null || !patternsNode.isArray()) return false;

            List<String> targetValues = extractTargetFieldValues(fieldsNode, securityEvent, httpEvent);
            for (JsonNode patNode : patternsNode) {
                Pattern pattern = Pattern.compile(patNode.asText());
                for (String val : targetValues) {
                    if (val != null && pattern.matcher(val).find()) {
                        return true;
                    }
                }
            }
        } else if ("PATH_CONTAINS".equals(type)) {
            if (securityEvent == null || securityEvent.getPath() == null) return false;
            JsonNode patternsNode = condNode.get("patterns");
            if (patternsNode != null && patternsNode.isArray()) {
                String path = securityEvent.getPath().toLowerCase();
                for (JsonNode patNode : patternsNode) {
                    if (path.contains(patNode.asText().toLowerCase())) {
                        return true;
                    }
                }
            }
        } else if ("STATUS_CODE_COUNT".equals(type)) {
            if (securityEvent == null || securityEvent.getStatusCode() == null) return false;
            int code = condNode.has("status_code") ? condNode.get("status_code").asInt() : 401;
            return securityEvent.getStatusCode() == code;
        } else if ("STATUS_CODE_BURST".equals(type)) {
            if (securityEvent == null || securityEvent.getStatusCode() == null) return false;
            return securityEvent.getStatusCode() >= 400;
        }

        return false;
    }

    private List<String> extractTargetFieldValues(JsonNode fieldsNode, SecurityEvent securityEvent, HttpEvent httpEvent) {
        List<String> values = new ArrayList<>();
        if (fieldsNode != null && fieldsNode.isArray()) {
            for (JsonNode f : fieldsNode) {
                String fieldName = f.asText();
                if ("url".equalsIgnoreCase(fieldName) && securityEvent.getUrl() != null) {
                    values.add(securityEvent.getUrl());
                } else if ("path".equalsIgnoreCase(fieldName) && securityEvent.getPath() != null) {
                    values.add(securityEvent.getPath());
                } else if ("query_parameters".equalsIgnoreCase(fieldName) && securityEvent.getQueryParameters() != null) {
                    values.add(securityEvent.getQueryParameters());
                } else if ("request_headers".equalsIgnoreCase(fieldName) && httpEvent != null && httpEvent.getRequestHeaders() != null) {
                    values.add(httpEvent.getRequestHeaders());
                } else if ("user_agent".equalsIgnoreCase(fieldName) && securityEvent.getUserAgent() != null) {
                    values.add(securityEvent.getUserAgent());
                }
            }
        }
        if (values.isEmpty()) {
            if (securityEvent.getUrl() != null) values.add(securityEvent.getUrl());
            if (securityEvent.getQueryParameters() != null) values.add(securityEvent.getQueryParameters());
        }
        return values;
    }

    private String buildEvidenceString(DetectionRule rule, SecurityEvent securityEvent, HttpEvent httpEvent) {
        return String.format("Rule '%s' [%s/%s] triggered on event %s (%s %s)",
                rule.getName(), rule.getSeverity(), rule.getConfidence(),
                securityEvent.getId(),
                securityEvent.getHttpMethod() != null ? securityEvent.getHttpMethod() : "EVENT",
                securityEvent.getPath() != null ? securityEvent.getPath() : "/");
    }
}
