package com.aegis.finding.service;

import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.SecurityAssessmentRepository;
import com.aegis.assessment.result.AssessmentObservation;
import com.aegis.assessment.result.AssessmentObservationRepository;
import com.aegis.attacksurface.entity.AttackSurfaceAsset;
import com.aegis.attacksurface.entity.WebEndpoint;
import com.aegis.attacksurface.repository.AttackSurfaceAssetRepository;
import com.aegis.attacksurface.repository.WebEndpointRepository;
import com.aegis.exception.ResourceNotFoundException;
import com.aegis.finding.entity.*;
import com.aegis.finding.repository.*;
import com.aegis.vulnerability.entity.CveRecord;
import com.aegis.vulnerability.entity.CweRecord;
import com.aegis.vulnerability.service.VulnerabilityIntelligenceProvider;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FindingNormalizationService {

    private static final Logger log = LoggerFactory.getLogger(FindingNormalizationService.class);

    private static final Pattern CVE_PATTERN = Pattern.compile("CVE-\\d{4}-\\d{4,7}", Pattern.CASE_INSENSITIVE);
    private static final Pattern CWE_PATTERN = Pattern.compile("CWE-\\d{1,5}", Pattern.CASE_INSENSITIVE);

    private final SecurityAssessmentRepository assessmentRepository;
    private final AssessmentObservationRepository rawObservationRepository;
    private final SecurityFindingRepository findingRepository;
    private final FindingEvidenceRepository evidenceRepository;
    private final FindingReferenceRepository referenceRepository;
    private final AttackSurfaceAssetRepository assetRepository;
    private final WebEndpointRepository endpointRepository;
    private final VulnerabilityIntelligenceProvider intelligenceProvider;

    @Transactional
    public void processAssessmentFindings(UUID assessmentId) {
        log.info("Processing finding normalization & deduplication for assessment {}", assessmentId);

        SecurityAssessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAssessment", "id", assessmentId));

        List<AssessmentObservation> rawObs = rawObservationRepository.findByAssessmentId(assessmentId);
        List<AttackSurfaceAsset> assets = assetRepository.findByAssessmentId(assessmentId);
        List<WebEndpoint> endpoints = endpointRepository.findByAssessmentId(assessmentId);

        AttackSurfaceAsset defaultAsset = assets.isEmpty() ? null : assets.get(0);

        for (AssessmentObservation obs : rawObs) {
            String normTitle = obs.getTitle() != null ? obs.getTitle().trim() : "Security Observation";
            String normDesc = obs.getDescription() != null ? obs.getDescription() : normTitle;
            FindingSeverity severity = mapSeverity(obs.getSeverity() != null ? obs.getSeverity().name() : "INFO");
            FindingConfidence confidence = mapConfidence(obs.getConfidence() != null ? obs.getConfidence().name() : "MEDIUM");
            FindingType findingType = mapFindingType(obs.getCategory(), obs.getSource(), normTitle);

            String dedupHash = computeHash(assessmentId.toString() + ":" + normTitle + ":" + findingType.name());

            Optional<SecurityFinding> existingOpt = findingRepository.findByAssessmentIdAndDeduplicationHash(assessmentId, dedupHash);
            SecurityFinding finding;
            if (existingOpt.isPresent()) {
                finding = existingOpt.get();
                finding.setLastSeenAt(Instant.now());
                if (!finding.getSource().contains(obs.getSource())) {
                    finding.setSource(finding.getSource() + ", " + obs.getSource());
                }
                findingRepository.save(finding);
            } else {
                finding = findingRepository.save(SecurityFinding.builder()
                        .assessment(assessment)
                        .asset(defaultAsset)
                        .title(normTitle)
                        .description(normDesc)
                        .findingType(findingType)
                        .severity(severity)
                        .originalSeverity(obs.getSeverity() != null ? obs.getSeverity().name() : "INFO")
                        .confidence(confidence)
                        .status(FindingStatus.OPEN)
                        .source(obs.getSource())
                        .deduplicationHash(dedupHash)
                        .build());
            }

            // Create Evidence with Sensitive Data Redaction
            String rawEv = obs.getEvidence() != null ? obs.getEvidence() : "";
            String redactedEv = redactSensitiveData(rawEv);

            evidenceRepository.save(FindingEvidence.builder()
                    .finding(finding)
                    .evidenceType(EvidenceType.TOOL_OUTPUT)
                    .source(obs.getSource())
                    .content(rawEv)
                    .redactedContent(redactedEv)
                    .hash(computeHash(rawEv))
                    .build());

            // Extract CVE / CWE references safely
            extractAndSaveReferences(finding, normTitle + " " + normDesc + " " + rawEv, obs.getSource());
        }
    }

    private FindingSeverity mapSeverity(String raw) {
        if (raw == null) return FindingSeverity.INFO;
        try {
            return FindingSeverity.valueOf(raw.toUpperCase());
        } catch (Exception e) {
            return FindingSeverity.INFO;
        }
    }

    private FindingConfidence mapConfidence(String raw) {
        if (raw == null) return FindingConfidence.MEDIUM;
        try {
            return FindingConfidence.valueOf(raw.toUpperCase());
        } catch (Exception e) {
            return FindingConfidence.MEDIUM;
        }
    }

    private FindingType mapFindingType(String category, String source, String title) {
        String combined = ((category != null ? category : "") + " " + (title != null ? title : "")).toUpperCase();
        if (combined.contains("HEADER") || combined.contains("HSTS") || combined.contains("CSP")) return FindingType.SECURITY_HEADER;
        if (combined.contains("TLS") || combined.contains("SSL") || combined.contains("HTTPS")) return FindingType.TLS_CONFIGURATION;
        if (combined.contains("VULN") || combined.contains("NUCLEI")) return FindingType.KNOWN_VULNERABILITY;
        if (combined.contains("PORT") || combined.contains("SERVICE")) return FindingType.EXPOSES_SERVICE;
        if (combined.contains("INFO") || combined.contains("DISCLOSURE")) return FindingType.INFORMATION_DISCLOSURE;
        return FindingType.MISCONFIGURATION;
    }

    private String redactSensitiveData(String text) {
        if (text == null || text.isBlank()) return text;
        String redacted = text;
        redacted = redacted.replaceAll("(?i)(bearer\\s+)[a-zA-Z0-9\\-\\._~\\+/=]+", "$1[REDACTED]");
        redacted = redacted.replaceAll("(?i)(password\\s*=\\s*)[^&\\s]+", "$1[REDACTED]");
        redacted = redacted.replaceAll("(?i)(session\\s*=\\s*)[^;\\s]+", "$1[REDACTED]");
        redacted = redacted.replaceAll("(?i)(api[_-]?key\\s*=\\s*)[^&\\s]+", "$1[REDACTED]");
        return redacted;
    }

    private void extractAndSaveReferences(SecurityFinding finding, String fullText, String source) {
        Matcher cveMatcher = CVE_PATTERN.matcher(fullText);
        while (cveMatcher.find()) {
            String cveId = cveMatcher.group().toUpperCase();
            Optional<CveRecord> cveOpt = intelligenceProvider.findCve(cveId);
            referenceRepository.save(FindingReference.builder()
                    .finding(finding)
                    .referenceType(ReferenceType.CVE)
                    .referenceId(cveId)
                    .title(cveOpt.map(CveRecord::getDescription).orElse("CVE Record: " + cveId))
                    .url("https://nvd.nist.gov/vuln/detail/" + cveId)
                    .source(source)
                    .build());
        }

        Matcher cweMatcher = CWE_PATTERN.matcher(fullText);
        while (cweMatcher.find()) {
            String cweId = cweMatcher.group().toUpperCase();
            Optional<CweRecord> cweOpt = intelligenceProvider.findCwe(cweId);
            referenceRepository.save(FindingReference.builder()
                    .finding(finding)
                    .referenceType(ReferenceType.CWE)
                    .referenceId(cweId)
                    .title(cweOpt.map(CweRecord::getName).orElse("CWE Record: " + cweId))
                    .url("https://cwe.mitre.org/data/definitions/" + cweId.replace("CWE-", "") + ".html")
                    .source(source)
                    .build());
        }
    }

    private String computeHash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }
}
