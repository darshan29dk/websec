package com.globalshield.ai.service;

import com.globalshield.ai.dto.StructuredAiOutput;
import com.globalshield.ai.entity.AiAnalysisClaim;
import com.globalshield.ai.entity.AiEvidenceReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiClaimValidator {

    private static final Logger log = LoggerFactory.getLogger(AiClaimValidator.class);
    private static final Pattern IP_PATTERN = Pattern.compile("\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b");

    public ValidationResult validateAndSanitize(StructuredAiOutput output, SecurityEvidenceContextBuilder.ContextResult contextResult) {
        List<AiAnalysisClaim> claims = new ArrayList<>();
        List<AiEvidenceReference> evidenceRefs = new ArrayList<>();

        Set<String> validEvIds = contextResult.getValidEvidenceIds();
        Set<String> validIps = contextResult.getValidSourceIps();

        boolean ipHallucinated = false;
        String fullText = String.join(" ", output.getObservedFacts()) + " " + output.getSummary();

        Matcher matcher = IP_PATTERN.matcher(fullText);
        while (matcher.find()) {
            String ip = matcher.group();
            if (!validIps.contains(ip) && !isLocalhostOrPrivate(ip)) {
                ipHallucinated = true;
                log.warn("AiClaimValidator: Detected unsupported source IP claim '{}'", ip);
            }
        }

        if (ipHallucinated || validIps.isEmpty()) {
            List<String> sanitizedFacts = new ArrayList<>();
            for (String fact : output.getObservedFacts()) {
                if (IP_PATTERN.matcher(fact).find() && !containsValidIp(fact, validIps)) {
                    sanitizedFacts.add("Source IP unavailable from available telemetry.");
                } else {
                    sanitizedFacts.add(fact);
                }
            }
            if (!sanitizedFacts.contains("Source IP unavailable from available telemetry.")) {
                sanitizedFacts.add("Source IP unavailable from available telemetry.");
            }
            output.setObservedFacts(sanitizedFacts);
        }

        List<String> validSupportingEvidence = new ArrayList<>();
        for (String evRef : output.getSupportingEvidence()) {
            String cleanRef = evRef.trim();
            if (validEvIds.contains(cleanRef) || cleanRef.matches("F-\\d+") || cleanRef.matches("H-\\d+")) {
                validSupportingEvidence.add(cleanRef);
            } else {
                log.warn("AiClaimValidator: Removing invalid/hallucinated evidence reference '{}'", cleanRef);
            }
        }
        output.setSupportingEvidence(validSupportingEvidence);

        for (String fact : output.getObservedFacts()) {
            AiAnalysisClaim claim = new AiAnalysisClaim();
            claim.setClaimType("OBSERVED_FACT");
            claim.setClaimText(fact);
            claim.setConfidence(0.95);

            if (fact.contains("Source IP unavailable") || fact.contains("Exact event time unavailable")) {
                claim.setValidationStatus("SUPPORTED");
            } else {
                claim.setValidationStatus("SUPPORTED");
            }
            claims.add(claim);
        }

        for (String inf : output.getInferences()) {
            AiAnalysisClaim claim = new AiAnalysisClaim();
            claim.setClaimType("INFERENCE");
            claim.setClaimText(inf);
            claim.setConfidence(0.80);
            claim.setValidationStatus("SUPPORTED");
            claims.add(claim);
        }

        for (String hyp : output.getHypotheses()) {
            AiAnalysisClaim claim = new AiAnalysisClaim();
            claim.setClaimType("HYPOTHESIS");
            claim.setClaimText(hyp);
            claim.setConfidence(0.60);
            claim.setValidationStatus("PARTIALLY_SUPPORTED");
            claims.add(claim);
        }

        for (String evId : output.getSupportingEvidence()) {
            AiEvidenceReference ref = new AiEvidenceReference();
            ref.setEvidenceType("FINDING");
            ref.setEvidenceId(evId);
            ref.setRelationship("SUPPORTS");
            ref.setDetails("Referenced in structured AI analysis");
            evidenceRefs.add(ref);
        }

        return new ValidationResult(output, claims, evidenceRefs);
    }

    private boolean containsValidIp(String text, Set<String> validIps) {
        for (String ip : validIps) {
            if (text.contains(ip)) return true;
        }
        return false;
    }

    private boolean isLocalhostOrPrivate(String ip) {
        return ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.");
    }

    public static class ValidationResult {
        private final StructuredAiOutput sanitizedOutput;
        private final List<AiAnalysisClaim> claims;
        private final List<AiEvidenceReference> evidenceReferences;

        public ValidationResult(StructuredAiOutput sanitizedOutput, List<AiAnalysisClaim> claims, List<AiEvidenceReference> evidenceReferences) {
            this.sanitizedOutput = sanitizedOutput;
            this.claims = claims;
            this.evidenceReferences = evidenceReferences;
        }

        public StructuredAiOutput getSanitizedOutput() { return sanitizedOutput; }
        public List<AiAnalysisClaim> getClaims() { return claims; }
        public List<AiEvidenceReference> getEvidenceReferences() { return evidenceReferences; }
    }
}
