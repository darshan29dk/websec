package com.aegis.posture.service;

import com.aegis.finding.entity.SecurityFinding;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class FindingFingerprintService {

    public String computeFingerprint(SecurityFinding finding) {
        if (finding == null) {
            return "";
        }
        
        String targetStr = extractTarget(finding);
        String pathStr = extractPath(finding);
        String methodStr = extractMethod(finding);
        String paramStr = extractParam(finding);
        String typeStr = finding.getFindingType() != null ? finding.getFindingType().name() : "";
        String cweCveStr = extractCweOrCve(finding);

        String raw = String.join("|",
            normalize(targetStr),
            normalize(pathStr),
            normalize(methodStr),
            normalize(paramStr),
            normalize(typeStr),
            normalize(cweCveStr)
        );

        return sha256(raw);
    }

    public String computeFingerprint(String target, String path, String method, String param, String findingType, String cweOrCve) {
        String raw = String.join("|",
            normalize(target),
            normalize(path),
            normalize(method),
            normalize(param),
            normalize(findingType),
            normalize(cweOrCve)
        );
        return sha256(raw);
    }

    private String extractTarget(SecurityFinding finding) {
        if (finding.getAssessment() != null && finding.getAssessment().getTarget() != null) {
            return finding.getAssessment().getTarget().getPrimaryUrl();
        }
        if (finding.getAsset() != null) {
            return finding.getAsset().getAssetValue();
        }
        return "";
    }

    private String extractPath(SecurityFinding finding) {
        if (finding.getEndpoint() != null) {
            return finding.getEndpoint().getPath();
        }
        return "";
    }

    private String extractMethod(SecurityFinding finding) {
        if (finding.getEndpoint() != null && finding.getEndpoint().getMethod() != null) {
            return finding.getEndpoint().getMethod();
        }
        return "";
    }


    private String extractParam(SecurityFinding finding) {
        return "";
    }

    private String extractCweOrCve(SecurityFinding finding) {
        if (finding.getTitle() != null) {
            return finding.getTitle();
        }
        return "";
    }

    private String normalize(String str) {
        if (str == null) return "";
        String trimmed = str.trim().toLowerCase(Locale.ROOT);
        if (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
