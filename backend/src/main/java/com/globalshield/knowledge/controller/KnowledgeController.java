package com.globalshield.knowledge.controller;

import com.globalshield.knowledge.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @PostMapping("/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KnowledgeDocumentDto> createDocument(@Valid @RequestBody KnowledgeIngestRequest request) {
        return ResponseEntity.ok(knowledgeService.ingestDocument(request));
    }

    @PostMapping("/ingest")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KnowledgeDocumentDto> ingestDocument(@Valid @RequestBody KnowledgeIngestRequest request) {
        return ResponseEntity.ok(knowledgeService.ingestDocument(request));
    }

    @GetMapping("/documents")
    public ResponseEntity<List<KnowledgeDocumentDto>> getAllDocuments() {
        return ResponseEntity.ok(knowledgeService.getAllDocuments());
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<KnowledgeDocumentDto> getDocumentById(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id);
            return knowledgeService.getDocumentByUuid(uuid)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<KnowledgeSearchResult>> searchKnowledge(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String documentType,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(knowledgeService.searchKnowledge(query, source, documentType, limit));
    }
}
