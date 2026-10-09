package com.globalshield.fuzzing.service;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.attacksurface.entity.WebEndpoint;
import com.globalshield.attacksurface.entity.WebEndpointParameter;
import com.globalshield.attacksurface.repository.WebEndpointParameterRepository;
import com.globalshield.attacksurface.repository.WebEndpointRepository;
import com.globalshield.audit.AuditEventType;
import com.globalshield.audit.AuditService;
import com.globalshield.defense.dto.CreateRemediationPlanRequest;
import com.globalshield.defense.dto.GenerateRecommendationRequest;
import com.globalshield.defense.service.DefenseService;
import com.globalshield.exception.BadRequestException;
import com.globalshield.exception.ResourceNotFoundException;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.fuzzing.analysis.FuzzingAnalysisResult;
import com.globalshield.fuzzing.analysis.FuzzingResultAnalyzer;
import com.globalshield.fuzzing.correlator.FuzzingFindingCorrelator;
import com.globalshield.fuzzing.coverage.FuzzingCoverageService;
import com.globalshield.fuzzing.dto.*;
import com.globalshield.fuzzing.entity.*;
import com.globalshield.fuzzing.execution.FuzzingExecutionService;
import com.globalshield.fuzzing.payload.FuzzingPayload;
import com.globalshield.fuzzing.payload.FuzzingPayloadProvider;
import com.globalshield.fuzzing.policy.FuzzingPolicyValidator;
import com.globalshield.fuzzing.repository.*;
import com.globalshield.fuzzing.schema.OpenApiSchemaParser;
import com.globalshield.investigation.Investigation;
import com.globalshield.investigation.InvestigationRepository;
import com.globalshield.investigation.InvestigationService;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FuzzingCampaignService {

    private static final Logger log = LoggerFactory.getLogger(FuzzingCampaignService.class);

    private final FuzzingCampaignRepository campaignRepository;
    private final FuzzingTestCaseRepository testCaseRepository;
    private final FuzzingExecutionRecordRepository executionRepository;
    private final FuzzingCoverageResultRepository coverageRepository;
    private final FuzzingMultiStepSequenceRepository sequenceRepository;
    private final SecurityTargetRepository targetRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final WebEndpointRepository endpointRepository;
    private final WebEndpointParameterRepository parameterRepository;
    private final SecurityFindingRepository findingRepository;
    private final InvestigationRepository investigationRepository;
    private final FuzzingPolicyValidator policyValidator;
    private final FuzzingPayloadProvider payloadProvider;
    private final FuzzingExecutionService executionService;
    private final FuzzingResultAnalyzer resultAnalyzer;
    private final FuzzingFindingCorrelator findingCorrelator;
    private final FuzzingCoverageService coverageService;
    private final OpenApiSchemaParser openApiSchemaParser;
    private final DefenseService defenseService;
    private final AuditService auditService;

    @Transactional
    public FuzzingCampaignResponse createCampaign(CreateFuzzingCampaignRequest request, UUID userId, String userEmail) {
        log.info("Creating fuzzing campaign: '{}' for target ID: {}", request.getName(), request.getTargetId());

        SecurityTarget target = targetRepository.findById(request.getTargetId())
                .orElseThrow(() -> new ResourceNotFoundException("SecurityTarget", "id", request.getTargetId()));

        policyValidator.validateCampaignPolicy(target, request);

        SecurityAssessment assessment = null;
        if (request.getAssessmentId() != null) {
            assessment = assessmentRepository.findById(request.getAssessmentId()).orElse(null);
        }

        String categoriesStr = request.getCategories() != null && !request.getCategories().isEmpty()
                ? String.join(",", request.getCategories())
                : "A01,A03,A05,A07,A10";

        FuzzingCampaign campaign = FuzzingCampaign.builder()
                .target(target)
                .assessment(assessment)
                .name(request.getName().trim())
                .profile(request.getProfile())
                .status(FuzzingStatus.PENDING)
                .targetScopeSnapshot(target.getPrimaryUrl())
                .rateLimitRps(request.getRateLimitRps())
                .maxRequests(request.getMaxRequests())
                .timeoutMs(request.getTimeoutMs())
                .concurrency(request.getConcurrency())
                .categories(categoriesStr)
                .customHeaders(request.getCustomHeaders())
                .createdBy(userEmail)
                .build();

        campaign = campaignRepository.save(campaign);

        // Generate bounded test cases based on endpoints and payloads
        List<FuzzingTestCase> testCases = generateTestCases(campaign, target, assessment, request);
        testCaseRepository.saveAll(testCases);

        campaign.setTotalTestCases(testCases.size());
        campaign = campaignRepository.save(campaign);

        // Initialize coverage baseline
        coverageService.evaluateCoverage(campaign);

        auditService.logEvent(
                userId, userEmail,
                AuditEventType.FUZZING_CAMPAIGN_CREATED,
                "FUZZING_CAMPAIGN", campaign.getId().toString(),
                "CREATE_CAMPAIGN", "Created web security fuzzing campaign with " + testCases.size() + " test cases",
                null, null
        );

        return FuzzingCampaignResponse.fromEntity(campaign);
    }

    private List<FuzzingTestCase> generateTestCases(
            FuzzingCampaign campaign,
            SecurityTarget target,
            SecurityAssessment assessment,
            CreateFuzzingCampaignRequest request
    ) {
        List<FuzzingTestCase> cases = new ArrayList<>();
        List<FuzzingPayload> payloads = payloadProvider.getPayloadsForProfile(campaign.getProfile(), request.getCategories());

        // Discover endpoints from attack surface if available
        List<WebEndpoint> endpoints = new ArrayList<>();
        if (request.getOpenApiSpec() != null && !request.getOpenApiSpec().isBlank()) {
            List<OpenApiSchemaParser.ApiOperation> apiOps = openApiSchemaParser.parseSpec(request.getOpenApiSpec());
            String baseUrl = target.getPrimaryUrl();
            if (baseUrl != null && baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }
            for (OpenApiSchemaParser.ApiOperation op : apiOps) {
                String fullUrl = (baseUrl != null ? baseUrl : "") + (op.getPath().startsWith("/") ? op.getPath() : "/" + op.getPath());
                endpoints.add(WebEndpoint.builder()
                        .url(fullUrl)
                        .normalizedUrl(fullUrl)
                        .path(op.getPath())
                        .method(op.getHttpMethod())
                        .source("OpenAPI Schema")
                        .build());
            }
        } else if (request.getSelectedEndpointIds() != null && !request.getSelectedEndpointIds().isEmpty()) {
            endpoints = endpointRepository.findAllById(request.getSelectedEndpointIds());
        } else if (assessment != null) {
            endpoints = endpointRepository.findByAssessmentId(assessment.getId());
        }

        if (endpoints.isEmpty()) {
            // Build default endpoints from target primary URL
            String baseUrl = target.getPrimaryUrl();
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }

            WebEndpoint rootEp = WebEndpoint.builder()
                    .url(baseUrl)
                    .path("/")
                    .method("GET")
                    .build();

            WebEndpoint queryEp = WebEndpoint.builder()
                    .url(baseUrl + "/search")
                    .path("/search")
                    .method("GET")
                    .build();

            WebEndpoint loginEp = WebEndpoint.builder()
                    .url(baseUrl + "/api/login")
                    .path("/api/login")
                    .method("POST")
                    .build();

            endpoints = List.of(rootEp, queryEp, loginEp);
        }

        int maxAllowed = request.getMaxRequests() != null ? request.getMaxRequests() : 100;
        int order = 0;

        for (WebEndpoint ep : endpoints) {
            String targetUrl = ep.getUrl() != null ? ep.getUrl() : target.getPrimaryUrl();
            String method = ep.getMethod() != null ? ep.getMethod() : "GET";

            List<WebEndpointParameter> params = ep.getId() != null
                    ? parameterRepository.findByEndpointId(ep.getId())
                    : List.of();

            List<String> paramNames = !params.isEmpty()
                    ? params.stream().map(WebEndpointParameter::getName).toList()
                    : ("POST".equalsIgnoreCase(method) ? List.of("username", "input") : List.of("q", "id", "search"));

            for (String param : paramNames) {
                for (FuzzingPayload p : payloads) {
                    if (cases.size() >= maxAllowed) {
                        break;
                    }

                    cases.add(FuzzingTestCase.builder()
                            .campaign(campaign)
                            .endpoint(ep.getId() != null ? ep : null)
                            .category(p.getOwaspCategory().getCode() + " - " + p.getOwaspCategory().getTitle())
                            .name(p.getName() + " on " + param)
                            .httpMethod(method)
                            .targetUrl(targetUrl)
                            .parameterName(param)
                            .payloadType(p.getPayloadType())
                            .testPayload(p.getTestValue())
                            .baselinePayload(p.getBaselineValue())
                            .executionOrder(order++)
                            .status(TestCaseStatus.PENDING)
                            .build());
                }
                if (cases.size() >= maxAllowed) break;
            }
            if (cases.size() >= maxAllowed) break;
        }

        // Add multi-step sequences if enabled or profile is MULTI_STEP_SEQUENCE
        if (campaign.getProfile() == FuzzingProfile.MULTI_STEP_SEQUENCE || request.isEnableMultiStepSequences()) {
            addMultiStepSequenceCases(campaign, target, cases, order, maxAllowed);
        }

        return cases;
    }

    private void addMultiStepSequenceCases(
            FuzzingCampaign campaign,
            SecurityTarget target,
            List<FuzzingTestCase> cases,
            int startingOrder,
            int maxAllowed
    ) {
        String baseUrl = target.getPrimaryUrl();
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);

        FuzzingMultiStepSequence seq = FuzzingMultiStepSequence.builder()
                .campaign(campaign)
                .sequenceName("Authenticated Session Parameter Fuzzing Sequence")
                .description("Multi-step safe flow: Step 1 initiates baseline session handshake -> Step 2 submits fuzzed input with session state -> Step 3 verifies access control integrity")
                .totalSteps(3)
                .currentStep(0)
                .status("PENDING")
                .build();
        sequenceRepository.save(seq);

        if (cases.size() < maxAllowed) {
            cases.add(FuzzingTestCase.builder()
                    .campaign(campaign)
                    .category("A07 - Authentication / Multi-Step Sequence")
                    .name("Sequence Step 1: Session Baseline Handshake")
                    .httpMethod("GET")
                    .targetUrl(baseUrl)
                    .parameterName("session_init")
                    .payloadType("SEQUENCE_STEP_HANDSHAKE")
                    .testPayload("baseline")
                    .baselinePayload("baseline")
                    .executionOrder(startingOrder++)
                    .multiStep(true)
                    .stepIndex(1)
                    .preconditions("Valid target reachability")
                    .stopCondition("HTTP status < 500")
                    .status(TestCaseStatus.PENDING)
                    .build());
        }

        if (cases.size() < maxAllowed) {
            cases.add(FuzzingTestCase.builder()
                    .campaign(campaign)
                    .category("A01 - Access Control / Multi-Step Sequence")
                    .name("Sequence Step 2: Session Parameter Traversal Mutation")
                    .httpMethod("GET")
                    .targetUrl(baseUrl + "/api/data")
                    .parameterName("view")
                    .payloadType("PATH_TRAVERSAL_UNIX")
                    .testPayload("../../../../etc/passwd")
                    .baselinePayload("default")
                    .executionOrder(startingOrder++)
                    .multiStep(true)
                    .stepIndex(2)
                    .preconditions("Successful step 1 cookie/token acquisition")
                    .stopCondition("Scope containment verified")
                    .status(TestCaseStatus.PENDING)
                    .build());
        }

        if (cases.size() < maxAllowed) {
            cases.add(FuzzingTestCase.builder()
                    .campaign(campaign)
                    .category("A03 - Injection / Multi-Step Sequence")
                    .name("Sequence Step 3: Authenticated Context Injection Check")
                    .httpMethod("GET")
                    .targetUrl(baseUrl + "/api/data")
                    .parameterName("id")
                    .payloadType("SQL_INJECTION_SYNTAX")
                    .testPayload("'")
                    .baselinePayload("1")
                    .executionOrder(startingOrder++)
                    .multiStep(true)
                    .stepIndex(3)
                    .preconditions("Successful step 2 execution")
                    .stopCondition("No target crash")
                    .status(TestCaseStatus.PENDING)
                    .build());
        }
    }

    @Async
    public void startCampaignAsync(UUID campaignId, UUID userId, String userEmail) {
        startCampaign(campaignId, userId, userEmail);
    }

    public void startCampaign(UUID campaignId, UUID userId, String userEmail) {
        log.info("Starting fuzzing campaign execution: {}", campaignId);

        FuzzingCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("FuzzingCampaign", "id", campaignId));

        if (campaign.getStatus() == FuzzingStatus.RUNNING) {
            log.warn("Campaign {} is already running", campaignId);
            return;
        }

        // Re-validate target authorization before execution
        SecurityTarget target = campaign.getTarget();
        policyValidator.validateCampaignPolicy(target, CreateFuzzingCampaignRequest.builder()
                .targetId(target.getId())
                .profile(campaign.getProfile())
                .rateLimitRps(campaign.getRateLimitRps())
                .maxRequests(campaign.getMaxRequests())
                .timeoutMs(campaign.getTimeoutMs())
                .build());

        campaign.setStatus(FuzzingStatus.RUNNING);
        campaign.setStartedAt(Instant.now());
        campaign = campaignRepository.save(campaign);

        auditService.logEvent(
                userId, userEmail,
                AuditEventType.FUZZING_CAMPAIGN_STARTED,
                "FUZZING_CAMPAIGN", campaign.getId().toString(),
                "START_CAMPAIGN", "Started fuzzing campaign execution",
                null, null
        );

        List<FuzzingTestCase> testCases = testCaseRepository.findByCampaignIdOrderByExecutionOrderAsc(campaignId);
        int executedCount = 0;
        int findingsCount = 0;
        int suspiciousCount = 0;
        Instant startTime = Instant.now();
        Map<String, String> sessionVariables = new HashMap<>();

        long delayBetweenRequestsMs = Math.max(20, 1000 / Math.max(1, campaign.getRateLimitRps()));

        for (FuzzingTestCase tc : testCases) {
            // Check for cancellation
            FuzzingCampaign current = campaignRepository.findById(campaignId).orElse(campaign);
            if (current.getStatus() == FuzzingStatus.CANCELLED) {
                log.info("Fuzzing campaign {} was cancelled by user. Terminating execution loop.", campaignId);
                markPendingCasesCancelled(testCases, tc);
                return;
            }

            tc.setStatus(TestCaseStatus.RUNNING);
            testCaseRepository.save(tc);

            // Rate-limiting pause
            try {
                Thread.sleep(delayBetweenRequestsMs);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }

            try {
                // 1. Run Baseline Request
                FuzzingExecutionService.RawHttpResponse baselineResp = executionService.executeRequest(
                        target,
                        tc.getTargetUrl(),
                        tc.getHttpMethod(),
                        tc.getParameterName(),
                        tc.getBaselinePayload(),
                        campaign.getCustomHeaders(),
                        sessionVariables,
                        campaign.getTimeoutMs()
                );

                // Harvest session tokens/cookies for multi-step continuity
                if (baselineResp.getExtractedVariables() != null) {
                    sessionVariables.putAll(baselineResp.getExtractedVariables());
                }

                // Rate limiting pause
                try {
                    Thread.sleep(delayBetweenRequestsMs / 2);
                } catch (InterruptedException ignored) {}

                // 2. Run Test Mutation Request
                FuzzingExecutionService.RawHttpResponse testResp = executionService.executeRequest(
                        target,
                        tc.getTargetUrl(),
                        tc.getHttpMethod(),
                        tc.getParameterName(),
                        tc.getTestPayload(),
                        campaign.getCustomHeaders(),
                        sessionVariables,
                        campaign.getTimeoutMs()
                );

                if (testResp.getExtractedVariables() != null) {
                    sessionVariables.putAll(testResp.getExtractedVariables());
                }

                // 3. Analyze Response Difference
                FuzzingAnalysisResult analysis = resultAnalyzer.analyzeResponse(
                        tc,
                        testResp.getStatusCode(),
                        testResp.getRawHeaders(),
                        testResp.getBodySnippet(),
                        testResp.getResponseTimeMs(),
                        baselineResp.getStatusCode(),
                        baselineResp.getBodySnippet()
                );

                // 4. Save Execution Record
                FuzzingExecutionRecord record = FuzzingExecutionRecord.builder()
                        .campaign(campaign)
                        .testCase(tc)
                        .requestUrl(tc.getTargetUrl())
                        .requestMethod(tc.getHttpMethod())
                        .requestHeadersSanitized(testResp.getSanitizedHeaders())
                        .requestBodySanitized(tc.getParameterName() + "=" + tc.getTestPayload())
                        .responseStatus(testResp.getStatusCode())
                        .responseTimeMs(testResp.getResponseTimeMs())
                        .responseHeadersSanitized(testResp.getSanitizedHeaders())
                        .responseBodySnippet(testResp.getBodySnippet())
                        .responseHash(testResp.getBodyHash())
                        .baselineStatus(baselineResp.getStatusCode())
                        .baselineDiffSummary(analysis.getDiffSummary())
                        .resultClassification(analysis.getClassification())
                        .confidence(analysis.getConfidence())
                        .anomalyDetails(analysis.getAnomalyDetails())
                        .executedAt(Instant.now())
                        .build();

                // 5. Correlate to Finding if Warranted
                if (analysis.isFindingWarranted()) {
                    SecurityFinding finding = findingCorrelator.correlateToFinding(campaign, tc, analysis, record);
                    if (finding != null) {
                        record.setFinding(finding);
                    }
                    if (analysis.getClassification() == TestResultClassification.VULNERABILITY_CONFIRMED) {
                        findingsCount++;
                    } else {
                        suspiciousCount++;
                    }
                }

                executionRepository.save(record);
                tc.setStatus(TestCaseStatus.COMPLETED);
                testCaseRepository.save(tc);

            } catch (Exception e) {
                log.warn("Fuzzing test case {} execution failed: {}", tc.getName(), e.getMessage());

                FuzzingExecutionRecord errRecord = FuzzingExecutionRecord.builder()
                        .campaign(campaign)
                        .testCase(tc)
                        .requestUrl(tc.getTargetUrl())
                        .requestMethod(tc.getHttpMethod())
                        .resultClassification(TestResultClassification.ERROR)
                        .errorMessage(e.getMessage())
                        .executedAt(Instant.now())
                        .build();
                executionRepository.save(errRecord);

                tc.setStatus(TestCaseStatus.COMPLETED);
                testCaseRepository.save(tc);
            }

            executedCount++;
            campaign.setExecutedTestCases(executedCount);
            campaign.setFindingsCount(findingsCount);
            campaign.setSuspiciousCount(suspiciousCount);
            campaign.setDurationMs(Duration.between(startTime, Instant.now()).toMillis());
            campaignRepository.save(campaign);
        }

        // Finalize Campaign
        campaign.setStatus(FuzzingStatus.COMPLETED);
        campaign.setCompletedAt(Instant.now());
        campaign.setDurationMs(Duration.between(startTime, Instant.now()).toMillis());
        campaignRepository.save(campaign);

        // Update Multi-Step Sequences status
        List<FuzzingMultiStepSequence> seqs = sequenceRepository.findByCampaignId(campaignId);
        for (FuzzingMultiStepSequence s : seqs) {
            s.setStatus("COMPLETED");
            s.setCurrentStep(s.getTotalSteps());
            sequenceRepository.save(s);
        }

        // Evaluate and persist final OWASP coverage
        coverageService.evaluateCoverage(campaign);

        auditService.logEvent(
                userId, userEmail,
                AuditEventType.FUZZING_CAMPAIGN_COMPLETED,
                "FUZZING_CAMPAIGN", campaign.getId().toString(),
                "COMPLETE_CAMPAIGN", "Completed fuzzing with " + executedCount + " tests (" + findingsCount + " findings, " + suspiciousCount + " suspicious)",
                null, null
        );

        log.info("Fuzzing campaign {} completed successfully: {} tests executed, {} findings, {} suspicious",
                campaignId, executedCount, findingsCount, suspiciousCount);
    }

    private void markPendingCasesCancelled(List<FuzzingTestCase> testCases, FuzzingTestCase current) {
        boolean mark = false;
        for (FuzzingTestCase tc : testCases) {
            if (tc.getId().equals(current.getId())) {
                mark = true;
            }
            if (mark && tc.getStatus() == TestCaseStatus.PENDING) {
                tc.setStatus(TestCaseStatus.CANCELLED);
                testCaseRepository.save(tc);
            }
        }
    }

    @Transactional
    public FuzzingCampaignResponse cancelCampaign(UUID campaignId, UUID userId, String userEmail) {
        FuzzingCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("FuzzingCampaign", "id", campaignId));

        if (campaign.getStatus() == FuzzingStatus.COMPLETED || campaign.getStatus() == FuzzingStatus.FAILED) {
            throw new BadRequestException("Campaign is already finished with status: " + campaign.getStatus());
        }

        campaign.setStatus(FuzzingStatus.CANCELLED);
        campaign.setCompletedAt(Instant.now());
        campaign = campaignRepository.save(campaign);

        // Mark remaining test cases cancelled
        List<FuzzingTestCase> pendingCases = testCaseRepository.findByCampaignIdAndStatus(campaignId, TestCaseStatus.PENDING);
        for (FuzzingTestCase tc : pendingCases) {
            tc.setStatus(TestCaseStatus.CANCELLED);
            testCaseRepository.save(tc);
        }

        auditService.logEvent(
                userId, userEmail,
                AuditEventType.FUZZING_CAMPAIGN_CANCELLED,
                "FUZZING_CAMPAIGN", campaign.getId().toString(),
                "CANCEL_CAMPAIGN", "Cancelled web security fuzzing campaign",
                null, null
        );

        return FuzzingCampaignResponse.fromEntity(campaign);
    }

    public ReproduceTestCaseResponse reproduceTestCase(ReproduceTestCaseRequest request, UUID userId, String userEmail) {
        FuzzingTestCase tc = testCaseRepository.findById(request.getTestCaseId())
                .orElseThrow(() -> new ResourceNotFoundException("FuzzingTestCase", "id", request.getTestCaseId()));

        FuzzingCampaign campaign = tc.getCampaign();
        SecurityTarget target = campaign.getTarget();

        policyValidator.validateEndpointScope(target, tc.getTargetUrl());

        String payloadToTest = request.getCustomPayloadOverride() != null && !request.getCustomPayloadOverride().isBlank()
                ? request.getCustomPayloadOverride()
                : tc.getTestPayload();

        try {
            FuzzingExecutionService.RawHttpResponse resp = executionService.executeRequest(
                    target,
                    tc.getTargetUrl(),
                    tc.getHttpMethod(),
                    tc.getParameterName(),
                    payloadToTest,
                    campaign.getCustomHeaders(),
                    null,
                    campaign.getTimeoutMs()
            );

            FuzzingAnalysisResult analysis = resultAnalyzer.analyzeResponse(
                    tc,
                    resp.getStatusCode(),
                    resp.getRawHeaders(),
                    resp.getBodySnippet(),
                    resp.getResponseTimeMs(),
                    null,
                    ""
            );

            auditService.logEvent(
                    userId, userEmail,
                    AuditEventType.FUZZING_REPRODUCTION_EXECUTED,
                    "FUZZING_TEST_CASE", tc.getId().toString(),
                    "REPRODUCE_TEST_CASE", "Executed safe reproduction of test case " + tc.getName(),
                    null, null
            );

            boolean reproduced = analysis.getClassification() == TestResultClassification.VULNERABILITY_CONFIRMED
                    || analysis.getClassification() == TestResultClassification.SUSPICIOUS;

            return ReproduceTestCaseResponse.builder()
                    .testCaseId(tc.getId())
                    .requestUrl(tc.getTargetUrl())
                    .requestMethod(tc.getHttpMethod())
                    .requestHeadersSanitized(resp.getSanitizedHeaders())
                    .requestBodySanitized(tc.getParameterName() + "=" + payloadToTest)
                    .responseStatus(resp.getStatusCode())
                    .responseTimeMs(resp.getResponseTimeMs())
                    .responseHeadersSanitized(resp.getSanitizedHeaders())
                    .responseBodySnippet(resp.getBodySnippet())
                    .classification(analysis.getClassification())
                    .anomalyDetails(analysis.getAnomalyDetails())
                    .reproduced(reproduced)
                    .summaryMessage(reproduced
                            ? "Finding condition successfully reproduced: " + analysis.getDiffSummary()
                            : "Vulnerability not observed during safe reproduction: response handled normally (" + resp.getStatusCode() + ")")
                    .executedAt(Instant.now())
                    .build();

        } catch (Exception e) {
            return ReproduceTestCaseResponse.builder()
                    .testCaseId(tc.getId())
                    .requestUrl(tc.getTargetUrl())
                    .requestMethod(tc.getHttpMethod())
                    .classification(TestResultClassification.ERROR)
                    .anomalyDetails("Execution error during reproduction: " + e.getMessage())
                    .reproduced(false)
                    .summaryMessage("Reproduction failed to execute: " + e.getMessage())
                    .executedAt(Instant.now())
                    .build();
        }
    }

    @Transactional
    public void linkFindingToRemediationOrInvestigation(LinkFindingRequest request, UUID userId, String userEmail) {
        SecurityFinding finding = findingRepository.findById(request.getFindingId())
                .orElseThrow(() -> new ResourceNotFoundException("SecurityFinding", "id", request.getFindingId()));

        if (request.isCreateRemediationPlan()) {
            String planTitle = request.getRemediationPlanTitle() != null && !request.getRemediationPlanTitle().isBlank()
                    ? request.getRemediationPlanTitle()
                    : "Remediation Plan for Fuzzing Finding: " + finding.getTitle();

            CreateRemediationPlanRequest planReq = new CreateRemediationPlanRequest();
            planReq.setFindingId(finding.getId());
            planReq.setTitle(planTitle);
            planReq.setDescription("Automated remediation plan created from fuzzing observation. Finding severity: " + finding.getSeverity());

            defenseService.createRemediationPlan(planReq, userEmail);
            log.info("Created remediation plan from fuzzing finding ID: {}", finding.getId());
        }

        if (request.getInvestigationId() != null) {
            Investigation inv = investigationRepository.findById(request.getInvestigationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Investigation", "id", request.getInvestigationId()));

            // Link finding evidence to investigation
            String currentHypothesis = inv.getPrimaryHypothesis() != null ? inv.getPrimaryHypothesis() : "";
            inv.setPrimaryHypothesis(currentHypothesis + "\n\nLinked Fuzzing Finding: " + finding.getTitle() + " (" + finding.getSeverity() + ")");
            investigationRepository.save(inv);
            log.info("Linked fuzzing finding ID: {} to investigation ID: {}", finding.getId(), inv.getId());
        }
    }

    // Queries
    public List<FuzzingCampaignResponse> getCampaignsByTarget(UUID targetId) {
        return campaignRepository.findByTargetIdOrderByCreatedAtDesc(targetId).stream()
                .map(FuzzingCampaignResponse::fromEntity)
                .toList();
    }

    public Page<FuzzingCampaignResponse> getCampaignsByTargetPaged(UUID targetId, Pageable pageable) {
        return campaignRepository.findByTargetId(targetId, pageable).map(FuzzingCampaignResponse::fromEntity);
    }

    public List<FuzzingCampaignResponse> getAllCampaigns() {
        return campaignRepository.findAll().stream()
                .map(FuzzingCampaignResponse::fromEntity)
                .toList();
    }

    public FuzzingCampaignResponse getCampaignById(UUID campaignId) {
        FuzzingCampaign c = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("FuzzingCampaign", "id", campaignId));
        return FuzzingCampaignResponse.fromEntity(c);
    }

    public List<FuzzingTestCaseResponse> getTestCases(UUID campaignId) {
        return testCaseRepository.findByCampaignIdOrderByExecutionOrderAsc(campaignId).stream()
                .map(FuzzingTestCaseResponse::fromEntity)
                .toList();
    }

    public Page<FuzzingTestCaseResponse> getTestCasesPaged(UUID campaignId, Pageable pageable) {
        return testCaseRepository.findByCampaignId(campaignId, pageable).map(FuzzingTestCaseResponse::fromEntity);
    }

    public Page<FuzzingExecutionRecordResponse> getExecutionRecordsPaged(
            UUID campaignId, TestResultClassification filterClassification, Pageable pageable) {
        if (filterClassification != null) {
            return executionRepository.findByCampaignIdAndResultClassification(campaignId, filterClassification, pageable)
                    .map(FuzzingExecutionRecordResponse::fromEntity);
        }
        return executionRepository.findByCampaignId(campaignId, pageable).map(FuzzingExecutionRecordResponse::fromEntity);
    }

    public List<FuzzingCoverageResponse> getCoverage(UUID campaignId) {
        return coverageRepository.findByCampaignIdOrderByOwaspCategoryAsc(campaignId).stream()
                .map(FuzzingCoverageResponse::fromEntity)
                .toList();
    }
}
