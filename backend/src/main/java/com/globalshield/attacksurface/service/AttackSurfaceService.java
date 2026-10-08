package com.globalshield.attacksurface.service;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentAssetRepository;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentEndpointRepository;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.assessment.result.AssessmentObservationRepository;
import com.globalshield.attacksurface.dto.*;
import com.globalshield.attacksurface.entity.*;
import com.globalshield.attacksurface.repository.*;
import com.globalshield.common.PageResponse;
import com.globalshield.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AttackSurfaceService {

    private static final Logger log = LoggerFactory.getLogger(AttackSurfaceService.class);

    private final SecurityAssessmentRepository assessmentRepository;
    private final AssessmentAssetRepository rawAssetRepository;
    private final AssessmentEndpointRepository rawEndpointRepository;
    private final AssessmentObservationRepository rawObservationRepository;

    private final AttackSurfaceAssetRepository attackSurfaceAssetRepository;
    private final AttackSurfaceRelationshipRepository relationshipRepository;
    private final TechnologyRepository technologyRepository;
    private final WebApplicationRepository webApplicationRepository;
    private final WebEndpointRepository webEndpointRepository;
    private final WebEndpointParameterRepository parameterRepository;

    @Transactional
    public void processAssessmentResults(UUID assessmentId) {
        log.info("Processing attack surface discovery for assessment {}", assessmentId);

        SecurityAssessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("SecurityAssessment", "id", assessmentId));

        // 1. Process Target Base Host Asset
        String primaryUrl = assessment.getTarget().getPrimaryUrl();
        URI uri = URI.create(primaryUrl);
        String hostStr = uri.getHost();
        int portVal = uri.getPort() > 0 ? uri.getPort() : ("https".equalsIgnoreCase(uri.getScheme()) ? 443 : 80);

        AttackSurfaceAsset hostAsset = attackSurfaceAssetRepository.findByAssessmentIdAndAssetTypeAndNormalizedValue(
                assessmentId, AssetType.HOST, hostStr.toLowerCase()
        ).orElseGet(() -> attackSurfaceAssetRepository.save(AttackSurfaceAsset.builder()
                .assessment(assessment)
                .assetType(AssetType.HOST)
                .assetValue(hostStr)
                .normalizedValue(hostStr.toLowerCase())
                .source("TARGET_DEFINITION")
                .confidence("VERY_HIGH")
                .build()));

        AttackSurfaceAsset portAsset = attackSurfaceAssetRepository.findByAssessmentIdAndAssetTypeAndNormalizedValue(
                assessmentId, AssetType.PORT, String.valueOf(portVal)
        ).orElseGet(() -> attackSurfaceAssetRepository.save(AttackSurfaceAsset.builder()
                .assessment(assessment)
                .assetType(AssetType.PORT)
                .assetValue(String.valueOf(portVal))
                .normalizedValue(String.valueOf(portVal))
                .parentAsset(hostAsset)
                .source("TARGET_DEFINITION")
                .confidence("VERY_HIGH")
                .build()));

        relationshipRepository.save(AttackSurfaceRelationship.builder()
                .assessment(assessment)
                .sourceAsset(hostAsset)
                .relationshipType(RelationshipType.EXPOSES)
                .targetAsset(portAsset)
                .source("TARGET_DEFINITION")
                .build());

        // 2. Process Raw Assets from Phase 2
        List<AssessmentAsset> rawAssets = rawAssetRepository.findByAssessmentId(assessmentId);
        for (AssessmentAsset rawAsset : rawAssets) {
            AssetType assetType = mapRawAssetType(rawAsset.getAssetType());
            String normVal = rawAsset.getValue().trim().toLowerCase();

            AttackSurfaceAsset asa = attackSurfaceAssetRepository.findByAssessmentIdAndAssetTypeAndNormalizedValue(
                    assessmentId, assetType, normVal
            ).orElseGet(() -> attackSurfaceAssetRepository.save(AttackSurfaceAsset.builder()
                    .assessment(assessment)
                    .assetType(assetType)
                    .assetValue(rawAsset.getValue())
                    .normalizedValue(normVal)
                    .parentAsset(hostAsset)
                    .source(rawAsset.getSource())
                    .confidence(rawAsset.getConfidence())
                    .build()));

            if (assetType == AssetType.IP_ADDRESS) {
                relationshipRepository.save(AttackSurfaceRelationship.builder()
                        .assessment(assessment)
                        .sourceAsset(hostAsset)
                        .relationshipType(RelationshipType.RESOLVES_TO)
                        .targetAsset(asa)
                        .source(rawAsset.getSource())
                        .build());
            }
        }

        // 3. Process Technologies
        List<AssessmentObservation> obsList = rawObservationRepository.findByAssessmentId(assessmentId);
        for (AssessmentObservation obs : obsList) {
            if ("TECHNOLOGY_DISCOVERY".equalsIgnoreCase(obs.getCategory()) || obs.getSource().equalsIgnoreCase("WHATWEB")) {
                String techName = extractTechName(obs.getTitle());
                TechnologyCategory category = mapTechCategory(techName);
                
                technologyRepository.findByAssessmentIdAndName(assessmentId, techName)
                        .orElseGet(() -> technologyRepository.save(Technology.builder()
                                .assessment(assessment)
                                .name(techName)
                                .category(category)
                                .source(obs.getSource())
                                .evidence(obs.getEvidence())
                                .confidence("HIGH")
                                .build()));
            }
        }

        // 4. Create Web Application Record
        WebApplication webApp = webApplicationRepository.findByAssessmentIdAndBaseUrl(assessmentId, primaryUrl)
                .orElseGet(() -> webApplicationRepository.save(WebApplication.builder()
                        .assessment(assessment)
                        .hostAsset(hostAsset)
                        .baseUrl(primaryUrl)
                        .applicationName(assessment.getTarget().getName())
                        .source("ASSESSMENT_ENGINE")
                        .confidence("HIGH")
                        .build()));

        // 5. Process Raw Endpoints
        List<AssessmentEndpoint> rawEndpoints = rawEndpointRepository.findByAssessmentId(assessmentId);
        for (AssessmentEndpoint ep : rawEndpoints) {
            String normUrl = ep.getUrl().trim();
            URI epUri;
            try {
                epUri = URI.create(normUrl);
            } catch (Exception e) {
                epUri = URI.create(primaryUrl);
            }

            String pathStr = epUri.getPath() != null && !epUri.getPath().isBlank() ? epUri.getPath() : "/";
            EndpointType epType = classifyEndpointType(pathStr, ep.getContentType());

            WebEndpoint webEndpoint = webEndpointRepository.findByAssessmentIdAndNormalizedUrlAndMethod(
                    assessmentId, normUrl, ep.getMethod()
            ).orElseGet(() -> webEndpointRepository.save(WebEndpoint.builder()
                    .assessment(assessment)
                    .application(webApp)
                    .url(ep.getUrl())
                    .normalizedUrl(normUrl)
                    .path(pathStr)
                    .method(ep.getMethod() != null ? ep.getMethod() : "GET")
                    .endpointType(epType)
                    .statusCode(ep.getStatusCode())
                    .contentType(ep.getContentType())
                    .source(ep.getSource())
                    .confidence("HIGH")
                    .build()));

            // Parse URL Query parameters with redaction
            if (epUri.getQuery() != null && !epUri.getQuery().isBlank()) {
                webEndpoint.setParametersPresent(true);
                webEndpointRepository.save(webEndpoint);
                
                String[] params = epUri.getQuery().split("&");
                for (String param : params) {
                    String[] kv = param.split("=", 2);
                    String paramName = kv[0];
                    String paramVal = kv.length > 1 ? kv[1] : "";
                    
                    String valueHash = hashValue(paramVal);
                    parameterRepository.findByEndpointIdAndNameAndLocation(webEndpoint.getId(), paramName, ParameterLocation.QUERY)
                            .orElseGet(() -> parameterRepository.save(WebEndpointParameter.builder()
                                    .endpoint(webEndpoint)
                                    .name(paramName)
                                    .location(ParameterLocation.QUERY)
                                    .parameterType("STRING")
                                    .observedValueHash(valueHash)
                                    .source(ep.getSource())
                                    .confidence("HIGH")
                                    .build()));
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public AttackSurfaceSummaryResponse getSummary(UUID assessmentId) {
        long hosts = attackSurfaceAssetRepository.countByAssessmentId(assessmentId);
        long technologies = technologyRepository.countByAssessmentId(assessmentId);
        long webApps = webApplicationRepository.countByAssessmentId(assessmentId);
        long endpoints = webEndpointRepository.countByAssessmentId(assessmentId);
        long apiEndpoints = webEndpointRepository.countByAssessmentIdAndEndpointType(assessmentId, EndpointType.API);
        long relationships = relationshipRepository.countByAssessmentId(assessmentId);

        return AttackSurfaceSummaryResponse.builder()
                .assessmentId(assessmentId)
                .totalAssets(hosts)
                .totalTechnologies(technologies)
                .totalWebApplications(webApps)
                .totalEndpoints(endpoints)
                .totalApiEndpoints(apiEndpoints)
                .totalRelationships(relationships)
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<AttackSurfaceAssetResponse> getAssets(UUID assessmentId, AssetType type, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "assetType"));
        Page<AttackSurfaceAsset> pageResult;
        if (type != null) {
            pageResult = attackSurfaceAssetRepository.findByAssessmentIdAndAssetType(assessmentId, type, pageRequest);
        } else {
            pageResult = attackSurfaceAssetRepository.findByAssessmentId(assessmentId, pageRequest);
        }
        return PageResponse.from(pageResult.map(AttackSurfaceAssetResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PageResponse<AttackSurfaceRelationshipResponse> getRelationships(UUID assessmentId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<AttackSurfaceRelationship> pageResult = relationshipRepository.findByAssessmentId(assessmentId, pageRequest);
        return PageResponse.from(pageResult.map(AttackSurfaceRelationshipResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PageResponse<TechnologyResponse> getTechnologies(UUID assessmentId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        Page<Technology> pageResult = technologyRepository.findByAssessmentId(assessmentId, pageRequest);
        return PageResponse.from(pageResult.map(TechnologyResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public PageResponse<WebEndpointResponse> getEndpoints(UUID assessmentId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "url"));
        Page<WebEndpoint> pageResult = webEndpointRepository.findByAssessmentId(assessmentId, pageRequest);
        return PageResponse.from(pageResult.map(WebEndpointResponse::fromEntity));
    }

    private AssetType mapRawAssetType(com.globalshield.assessment.result.AssetType rawType) {
        if (rawType == null) return AssetType.HOST;
        try {
            return AssetType.valueOf(rawType.name());
        } catch (Exception e) {
            return AssetType.HOST;
        }
    }

    private EndpointType classifyEndpointType(String path, String contentType) {
        String lowerPath = path.toLowerCase();
        if (lowerPath.contains("/api/") || lowerPath.contains("/v1/") || lowerPath.contains("/v2/")) {
            return EndpointType.API;
        }
        if (lowerPath.contains("/graphql")) {
            return EndpointType.GRAPHQL;
        }
        if (contentType != null && contentType.toLowerCase().contains("application/json")) {
            return EndpointType.API;
        }
        return EndpointType.WEB;
    }

    private String extractTechName(String title) {
        if (title.contains(":")) {
            String[] parts = title.split(":", 2);
            return parts[1].trim();
        }
        return title;
    }

    private TechnologyCategory mapTechCategory(String name) {
        String lower = name.toLowerCase();
        if (lower.contains("nginx") || lower.contains("apache") || lower.contains("iis")) return TechnologyCategory.WEB_SERVER;
        if (lower.contains("react") || lower.contains("angular") || lower.contains("vue") || lower.contains("jquery")) return TechnologyCategory.JAVASCRIPT;
        if (lower.contains("spring") || lower.contains("express") || lower.contains("django") || lower.contains("laravel")) return TechnologyCategory.FRAMEWORK;
        if (lower.contains("wordpress") || lower.contains("drupal")) return TechnologyCategory.CMS;
        return TechnologyCategory.OTHER;
    }

    private String hashValue(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(val.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
