package com.aegis.defense.controller;

import com.aegis.defense.dto.*;
import com.aegis.defense.service.DefenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/defense")
public class DefenseController {

    private final DefenseService defenseService;

    @Autowired
    public DefenseController(DefenseService defenseService) {
        this.defenseService = defenseService;
    }

    @GetMapping("/overview")
    public ResponseEntity<DefenseOverviewMetricsDto> getOverviewMetrics() {
        return ResponseEntity.ok(defenseService.getOverviewMetrics());
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<DefenseRecommendationResponseDto>> listRecommendations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        return ResponseEntity.ok(defenseService.listRecommendations(status, priority));
    }

    @GetMapping("/recommendations/{id}")
    public ResponseEntity<DefenseRecommendationResponseDto> getRecommendation(@PathVariable UUID id) {
        return ResponseEntity.ok(defenseService.getRecommendationById(id));
    }

    @PostMapping("/recommendations/generate")
    public ResponseEntity<DefenseRecommendationResponseDto> generateRecommendation(
            @RequestBody GenerateRecommendationRequest request,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(defenseService.generateRecommendation(request, username));
    }

    @PostMapping("/recommendations/{id}/review")
    public ResponseEntity<DefenseRecommendationResponseDto> reviewRecommendation(
            @PathVariable UUID id,
            @RequestBody ReviewRecommendationRequest request,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(defenseService.reviewRecommendation(id, request, username));
    }

    @PutMapping("/recommendations/{id}/status")
    public ResponseEntity<DefenseRecommendationResponseDto> updateRecommendationStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(defenseService.updateStatus(id, request, username));
    }

    @GetMapping("/controls")
    public ResponseEntity<List<DefenseControlDto>> listControls(@RequestParam(required = false) String category) {
        return ResponseEntity.ok(defenseService.listControls(category));
    }

    @GetMapping("/controls/{id}")
    public ResponseEntity<DefenseControlDto> getControl(@PathVariable UUID id) {
        return ResponseEntity.ok(defenseService.getControl(id));
    }

    @GetMapping("/findings/{findingId}")
    public ResponseEntity<List<DefenseRecommendationResponseDto>> getRecommendationsForFinding(@PathVariable UUID findingId) {
        return ResponseEntity.ok(defenseService.getRecommendationsForFinding(findingId));
    }

    @GetMapping("/validation-plans/{id}")
    public ResponseEntity<DefenseRecommendationResponseDto> getValidationPlan(@PathVariable UUID id) {
        return ResponseEntity.ok(defenseService.getRecommendationById(id));
    }
}
