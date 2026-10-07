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
@RequestMapping("/api/v1/remediation")
public class RemediationController {

    private final DefenseService defenseService;

    @Autowired
    public RemediationController(DefenseService defenseService) {
        this.defenseService = defenseService;
    }

    @GetMapping("/plans")
    public ResponseEntity<List<RemediationPlanDto>> listPlans(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(defenseService.listRemediationPlans(status));
    }

    @PostMapping("/plans")
    public ResponseEntity<RemediationPlanDto> createPlan(
            @RequestBody CreateRemediationPlanRequest request,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(defenseService.createRemediationPlan(request, username));
    }

    @GetMapping("/plans/{id}")
    public ResponseEntity<RemediationPlanDto> getPlan(@PathVariable UUID id) {
        return ResponseEntity.ok(defenseService.getRemediationPlan(id));
    }

    @PutMapping("/plans/{id}")
    public ResponseEntity<RemediationPlanDto> updatePlan(
            @PathVariable UUID id,
            @RequestBody CreateRemediationPlanRequest request,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(defenseService.updateRemediationPlan(id, request, username));
    }

    @PostMapping("/plans/{id}/tasks")
    public ResponseEntity<RemediationTaskDto> addTask(
            @PathVariable UUID id,
            @RequestBody CreateRemediationTaskRequest request,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(defenseService.addRemediationTask(id, request, username));
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<RemediationTaskDto> updateTaskStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request,
            Authentication auth) {
        String username = auth != null ? auth.getName() : "system";
        return ResponseEntity.ok(defenseService.updateTaskStatus(id, request, username));
    }
}
