package com.aegis.ai.controller;

import com.aegis.ai.dto.*;
import com.aegis.ai.entity.AiAnalysisClaim;
import com.aegis.ai.entity.AiEvidenceReference;
import com.aegis.ai.entity.AiKnowledgeReference;
import com.aegis.ai.service.AiSecurityAnalystService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/investigations")
public class AiInvestigationController {

    private final AiSecurityAnalystService analystService;

    public AiInvestigationController(AiSecurityAnalystService analystService) {
        this.analystService = analystService;
    }

    @PostMapping
    public ResponseEntity<AiInvestigationResponseDto> createInvestigation(
            @RequestBody AiInvestigationRequestDto request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "security_analyst";
        return ResponseEntity.ok(analystService.requestInvestigation(request, username));
    }

    @GetMapping
    public ResponseEntity<List<AiInvestigationResponseDto>> getAllInvestigations() {
        return ResponseEntity.ok(analystService.getAllInvestigations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AiInvestigationResponseDto> getInvestigationById(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            return analystService.getInvestigationByUuid(uuid)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<AiInvestigationResponseDto> runInvestigation(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            return analystService.getInvestigationByUuid(uuid).map(inv -> {
                analystService.runInvestigationAsync(inv.getId());
                return ResponseEntity.ok(inv);
            }).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AiInvestigationResponseDto> cancelInvestigation(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            return analystService.cancelInvestigation(uuid)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/evidence")
    public ResponseEntity<List<AiEvidenceReference>> getEvidenceReferences(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            return analystService.getInvestigationByUuid(uuid)
                    .map(inv -> ResponseEntity.ok(inv.getEvidenceReferences()))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/knowledge")
    public ResponseEntity<List<AiKnowledgeReference>> getKnowledgeReferences(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            return analystService.getInvestigationByUuid(uuid)
                    .map(inv -> ResponseEntity.ok(inv.getKnowledgeReferences()))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/claims")
    public ResponseEntity<List<AiAnalysisClaim>> getClaims(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            return analystService.getInvestigationByUuid(uuid)
                    .map(inv -> ResponseEntity.ok(inv.getClaims()))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<AiQuestionResponseDto> askQuestion(
            @PathVariable String id,
            @Valid @RequestBody AiQuestionRequestDto questionRequest) {
        try {
            UUID uuid = UUID.fromString(id);
            return ResponseEntity.ok(analystService.answerQuestion(uuid, questionRequest.getQuestion()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
