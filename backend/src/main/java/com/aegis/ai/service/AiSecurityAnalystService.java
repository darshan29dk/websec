package com.aegis.ai.service;

import com.aegis.ai.dto.*;
import com.aegis.ai.entity.*;
import com.aegis.ai.provider.LlmProvider;
import com.aegis.ai.provider.LlmRequest;
import com.aegis.ai.provider.LlmResponse;
import com.aegis.ai.repository.*;
import com.aegis.audit.AuditService;
import com.aegis.knowledge.KnowledgeSearchResult;
import com.aegis.knowledge.KnowledgeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiSecurityAnalystService {

    private static final Logger log = LoggerFactory.getLogger(AiSecurityAnalystService.class);

    private final AiInvestigationRepository investigationRepository;
    private final AiAnalysisClaimRepository claimRepository;
    private final AiEvidenceReferenceRepository evidenceReferenceRepository;
    private final AiKnowledgeReferenceRepository knowledgeReferenceRepository;
    private final LlmProvider llmProvider;
    private final KnowledgeService knowledgeService;
    private final SecurityEvidenceContextBuilder evidenceContextBuilder;
    private final SecretRedactionService secretRedactionService;
    private final PromptInjectionDefense promptInjectionDefense;
    private final AiClaimValidator claimValidator;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public AiSecurityAnalystService(AiInvestigationRepository investigationRepository,
                                   AiAnalysisClaimRepository claimRepository,
                                   AiEvidenceReferenceRepository evidenceReferenceRepository,
                                   AiKnowledgeReferenceRepository knowledgeReferenceRepository,
                                   LlmProvider llmProvider,
                                   KnowledgeService knowledgeService,
                                   SecurityEvidenceContextBuilder evidenceContextBuilder,
                                   SecretRedactionService secretRedactionService,
                                   PromptInjectionDefense promptInjectionDefense,
                                   AiClaimValidator claimValidator,
                                   AuditService auditService) {
        this.investigationRepository = investigationRepository;
        this.claimRepository = claimRepository;
        this.evidenceReferenceRepository = evidenceReferenceRepository;
        this.knowledgeReferenceRepository = knowledgeReferenceRepository;
        this.llmProvider = llmProvider;
        this.knowledgeService = knowledgeService;
        this.evidenceContextBuilder = evidenceContextBuilder;
        this.secretRedactionService = secretRedactionService;
        this.promptInjectionDefense = promptInjectionDefense;
        this.claimValidator = claimValidator;
        this.auditService = auditService;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public AiInvestigationResponseDto requestInvestigation(AiInvestigationRequestDto request, String username) {
        if (request.getAssessmentId() != null) {
            List<AiInvestigation> active = investigationRepository.findByAssessmentId(request.getAssessmentId())
                    .stream()
                    .filter(i -> "QUEUED".equals(i.getStatus()) || "RUNNING".equals(i.getStatus()))
                    .collect(Collectors.toList());
            if (!active.isEmpty()) {
                AiInvestigation existing = active.get(0);
                return getInvestigationDto(existing);
            }
        }

        AiInvestigation inv = new AiInvestigation();
        inv.setAssessmentId(request.getAssessmentId());
        inv.setIncidentId(request.getIncidentId());
        inv.setRequestedBy(username != null ? username : "system_analyst");
        inv.setStatus("QUEUED");
        inv.setProvider(llmProvider.getProviderName());
        inv.setModel(llmProvider.getModel());
        inv.setPromptVersion("1.0");

        inv = investigationRepository.save(inv);

        auditService.logEvent(null, username, com.aegis.audit.AuditEventType.AI_ANALYSIS_REQUESTED, "AI_INVESTIGATION", inv.getId().toString(), "AI_ANALYSIS_QUEUED", "AI Investigation queued: ID " + inv.getId(), "127.0.0.1", "AEGIS-Analyst");

        runInvestigationAsync(inv.getId());

        return getInvestigationDto(inv);
    }

    @Async
    @Transactional
    public void runInvestigationAsync(Long investigationId) {
        Optional<AiInvestigation> optInv = investigationRepository.findById(investigationId);
        if (optInv.isEmpty()) return;

        AiInvestigation inv = optInv.get();
        if (!"QUEUED".equals(inv.getStatus())) return;

        inv.setStatus("RUNNING");
        inv.setStartedAt(OffsetDateTime.now());
        investigationRepository.save(inv);

        auditService.logEvent(null, inv.getRequestedBy(), com.aegis.audit.AuditEventType.AI_ANALYSIS_STARTED, "AI_INVESTIGATION", inv.getId().toString(), "AI_ANALYSIS_STARTED", "AI Investigation started: ID " + inv.getId(), "127.0.0.1", "AEGIS-Analyst");

        try {
            if (!llmProvider.isAvailable()) {
                inv.setStatus("FAILED");
                inv.setFailureReason("AI analysis unavailable. Evidence remains available for manual investigation.");
                inv.setCompletedAt(OffsetDateTime.now());
                investigationRepository.save(inv);
                auditService.logEvent(null, inv.getRequestedBy(), com.aegis.audit.AuditEventType.AI_ANALYSIS_FAILED, "AI_INVESTIGATION", inv.getId().toString(), "AI_ANALYSIS_FAILED", "AI Provider unavailable", "127.0.0.1", "AEGIS-Analyst");
                return;
            }

            SecurityEvidenceContextBuilder.ContextResult contextResult = evidenceContextBuilder.buildContext(inv.getAssessmentId(), inv.getIncidentId());
            String redactedEvidenceText = secretRedactionService.redactSecrets(contextResult.getContextText());

            List<KnowledgeSearchResult> knowledgeResults = knowledgeService.searchKnowledge("SQL Injection XSS CSRF vulnerability header", null, null, 5);

            StringBuilder knSb = new StringBuilder("=== RETRIEVED AUTHORITATIVE SECURITY KNOWLEDGE (RAG) ===\n\n");
            for (KnowledgeSearchResult kn : knowledgeResults) {
                knSb.append("- Source: ").append(kn.getSource()).append(" (").append(kn.getTitle()).append(")\n");
                knSb.append("  Excerpt: ").append(kn.getContentExcerpt()).append("\n\n");
            }

            String systemPrompt = promptInjectionDefense.buildSystemPrompt();
            String userPrompt = "ANALYZE THE FOLLOWING AEGIS SECURITY EVIDENCE AND AUTHORITATIVE KNOWLEDGE:\n\n" +
                    knSb.toString() + "\n\n" +
                    promptInjectionDefense.wrapUntrustedTargetData(redactedEvidenceText) + "\n\n" +
                    "PROVIDE A COMPLETE STRUCTURED JSON SECURITY ANALYSIS MATCHING THE REQUIRED SCHEMA.";

            LlmRequest llmRequest = new LlmRequest(systemPrompt, userPrompt);
            llmRequest.setJsonMode(true);

            LlmResponse llmResponse = llmProvider.generate(llmRequest);

            if (!llmResponse.isSuccess() || llmResponse.getContent() == null) {
                inv.setStatus("FAILED");
                inv.setFailureReason(llmResponse.getErrorMessage() != null ? llmResponse.getErrorMessage() : "LLM generation failed");
                inv.setCompletedAt(OffsetDateTime.now());
                investigationRepository.save(inv);
                auditService.logEvent(null, inv.getRequestedBy(), com.aegis.audit.AuditEventType.AI_ANALYSIS_FAILED, "AI_INVESTIGATION", inv.getId().toString(), "AI_ANALYSIS_FAILED", "LLM generation failed", "127.0.0.1", "AEGIS-Analyst");
                return;
            }

            StructuredAiOutput parsedOutput;
            try {
                parsedOutput = objectMapper.readValue(cleanJsonString(llmResponse.getContent()), StructuredAiOutput.class);
            } catch (Exception parseEx) {
                log.warn("Failed to parse LLM JSON output, attempting structured recovery", parseEx);
                parsedOutput = new StructuredAiOutput();
                parsedOutput.setVerdict("INSUFFICIENT_EVIDENCE");
                parsedOutput.setSummary("AI analysis completed but returned unparsable structured output. Manual investigation recommended.");
            }

            AiClaimValidator.ValidationResult validationResult = claimValidator.validateAndSanitize(parsedOutput, contextResult);
            StructuredAiOutput finalOutput = validationResult.getSanitizedOutput();

            inv.setStatus("COMPLETED");
            inv.setConfidence(finalOutput.getConfidence());
            inv.setConfidenceBasis(finalOutput.getConfidenceBasis());
            inv.setVerdict(finalOutput.getVerdict());
            inv.setSummary(finalOutput.getSummary());
            inv.setWhatHappened(finalOutput.getWhatHappened());
            inv.setTimelineSummary(String.join("\n", finalOutput.getTimeline()));
            inv.setAffectedTargetSummary(finalOutput.getAffectedTarget());
            inv.setAffectedEndpointsSummary(String.join(", ", finalOutput.getAffectedEndpoints()));
            inv.setRootCause(finalOutput.getRootCause());
            inv.setImpact(finalOutput.getImpact());
            inv.setSupportingEvidenceSummary(String.join(", ", finalOutput.getSupportingEvidence()));
            inv.setContradictingEvidenceSummary(String.join(", ", finalOutput.getContradictingEvidence()));
            inv.setMissingEvidenceSummary(String.join(", ", finalOutput.getMissingEvidence()));
            inv.setRecommendedNextSteps(String.join("\n", finalOutput.getRecommendedNextSteps()));
            inv.setLimitations(String.join("\n", finalOutput.getLimitations()));
            inv.setRawResponse(llmResponse.getContent());
            inv.setCompletedAt(OffsetDateTime.now());

            inv = investigationRepository.save(inv);

            for (AiAnalysisClaim claim : validationResult.getClaims()) {
                claim.setInvestigationId(inv.getId());
                claimRepository.save(claim);
            }

            for (AiEvidenceReference evRef : validationResult.getEvidenceReferences()) {
                evRef.setInvestigationId(inv.getId());
                evidenceReferenceRepository.save(evRef);
            }

            for (KnowledgeSearchResult knRes : knowledgeResults) {
                AiKnowledgeReference knRef = new AiKnowledgeReference();
                knRef.setInvestigationId(inv.getId());
                knRef.setDocumentId(knRes.getDocumentId());
                knRef.setChunkId(knRes.getChunkId());
                knRef.setRelevanceScore(knRes.getRelevanceScore());
                knRef.setCitationText(knRes.getSource() + " - " + knRes.getTitle());
                knowledgeReferenceRepository.save(knRef);
            }

            auditService.logEvent(null, inv.getRequestedBy(), com.aegis.audit.AuditEventType.AI_ANALYSIS_COMPLETED, "AI_INVESTIGATION", inv.getId().toString(), "AI_ANALYSIS_COMPLETED", "AI Investigation completed: Verdict " + inv.getVerdict(), "127.0.0.1", "AEGIS-Analyst");

        } catch (Exception e) {
            log.error("AI Investigation failed due to unexpected error", e);
            inv.setStatus("FAILED");
            inv.setFailureReason("Internal investigation error: " + e.getMessage());
            inv.setCompletedAt(OffsetDateTime.now());
            investigationRepository.save(inv);
            auditService.logEvent(null, inv.getRequestedBy(), com.aegis.audit.AuditEventType.AI_ANALYSIS_FAILED, "AI_INVESTIGATION", inv.getId().toString(), "AI_ANALYSIS_ERROR", "Unexpected error: " + e.getMessage(), "127.0.0.1", "AEGIS-Analyst");
        }
    }

    @Transactional
    public AiQuestionResponseDto answerQuestion(UUID investigationUuid, String question) {
        AiInvestigation inv = investigationRepository.findByUuid(investigationUuid)
                .orElseThrow(() -> new IllegalArgumentException("Investigation not found: " + investigationUuid));

        auditService.logEvent(null, inv.getRequestedBy(), com.aegis.audit.AuditEventType.AI_QUESTION_REQUESTED, "AI_INVESTIGATION", inv.getId().toString(), "ASK_QUESTION", "Question asked: " + question, "127.0.0.1", "AEGIS-Analyst");

        String systemPrompt = promptInjectionDefense.buildSystemPrompt();
        String userPrompt = String.format("""
            CURRENT AI INVESTIGATION CONTEXT:
            Verdict: %s
            Summary: %s
            Root Cause: %s
            Impact: %s
            Supporting Evidence: %s
            
            ANALYST QUESTION:
            %s
            """, inv.getVerdict(), inv.getSummary(), inv.getRootCause(), inv.getImpact(), inv.getSupportingEvidenceSummary(), question);

        LlmRequest request = new LlmRequest(systemPrompt, userPrompt, 0.1, 1024, false);
        LlmResponse response = llmProvider.generate(request);

        AiQuestionResponseDto dto = new AiQuestionResponseDto();
        dto.setQuestion(question);

        if (response.isSuccess() && response.getContent() != null) {
            dto.setAnswer(secretRedactionService.redactSecrets(response.getContent()));
            dto.setConfidenceBasis("Evaluated against AEGIS Investigation " + inv.getUuid());
        } else {
            dto.setAnswer("AI question processing is currently unavailable.");
            dto.setConfidenceBasis("LLM provider unavailable");
        }

        if (inv.getSupportingEvidenceSummary() != null && !inv.getSupportingEvidenceSummary().isBlank()) {
            dto.setEvidenceCitations(Arrays.asList(inv.getSupportingEvidenceSummary().split(",\\s*")));
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public List<AiInvestigationResponseDto> getAllInvestigations() {
        return investigationRepository.findAll().stream().map(this::getInvestigationDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<AiInvestigationResponseDto> getInvestigationByUuid(UUID uuid) {
        return investigationRepository.findByUuid(uuid).map(this::getInvestigationDto);
    }

    @Transactional
    public Optional<AiInvestigationResponseDto> cancelInvestigation(UUID uuid) {
        return investigationRepository.findByUuid(uuid).map(inv -> {
            if ("QUEUED".equals(inv.getStatus()) || "RUNNING".equals(inv.getStatus())) {
                inv.setStatus("CANCELLED");
                inv.setCompletedAt(OffsetDateTime.now());
                investigationRepository.save(inv);
            }
            return getInvestigationDto(inv);
        });
    }

    private AiInvestigationResponseDto getInvestigationDto(AiInvestigation inv) {
        List<AiAnalysisClaim> claims = claimRepository.findByInvestigationId(inv.getId());
        List<AiEvidenceReference> evRefs = evidenceReferenceRepository.findByInvestigationId(inv.getId());
        List<AiKnowledgeReference> knRefs = knowledgeReferenceRepository.findByInvestigationId(inv.getId());
        return AiInvestigationResponseDto.fromEntity(inv, claims, evRefs, knRefs);
    }

    private String cleanJsonString(String str) {
        if (str == null) return "{}";
        String trimmed = str.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }
}
