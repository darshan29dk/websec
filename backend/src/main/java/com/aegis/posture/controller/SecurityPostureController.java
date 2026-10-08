package com.aegis.posture.controller;

import com.aegis.posture.dto.*;
import com.aegis.posture.entity.RegressionConfidence;
import com.aegis.posture.entity.RegressionStatus;
import com.aegis.posture.entity.RegressionType;
import com.aegis.posture.service.AssessmentComparisonService;
import com.aegis.posture.service.SecurityPostureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/targets")
@RequiredArgsConstructor
public class SecurityPostureController {

    private final SecurityPostureService postureService;
    private final AssessmentComparisonService comparisonService;

    @GetMapping("/{id}/posture")
    public ResponseEntity<SecurityPostureSnapshotDto> getPosture(@PathVariable("id") UUID targetId) {
        return ResponseEntity.ok(postureService.getCurrentPosture(targetId));
    }

    @GetMapping("/{id}/posture/current")
    public ResponseEntity<SecurityPostureSnapshotDto> getCurrentPosture(@PathVariable("id") UUID targetId) {
        return ResponseEntity.ok(postureService.getCurrentPosture(targetId));
    }

    @GetMapping("/{id}/posture/history")
    public ResponseEntity<List<SecurityPostureSnapshotDto>> getPostureHistory(@PathVariable("id") UUID targetId) {
        return ResponseEntity.ok(postureService.getPostureHistory(targetId));
    }

    @GetMapping("/{id}/posture/dimensions")
    public ResponseEntity<List<SecurityPostureDimensionDto>> getPostureDimensions(@PathVariable("id") UUID targetId) {
        return ResponseEntity.ok(postureService.getPostureDimensions(targetId));
    }

    @GetMapping("/{id}/posture/factors")
    public ResponseEntity<List<PostureScoreFactorDto>> getPostureFactors(@PathVariable("id") UUID targetId) {
        return ResponseEntity.ok(postureService.getPostureFactors(targetId));
    }

    @GetMapping("/{id}/posture/trends")
    public ResponseEntity<List<PostureTrendPointDto>> getPostureTrends(@PathVariable("id") UUID targetId) {
        return ResponseEntity.ok(postureService.getPostureTrends(targetId));
    }

    @PostMapping("/{id}/posture/recalculate")
    public ResponseEntity<SecurityPostureSnapshotDto> recalculatePosture(
        @PathVariable("id") UUID targetId,
        Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "ANONYMOUS";
        return ResponseEntity.ok(postureService.recalculatePosture(targetId, userEmail));
    }

    @GetMapping("/{id}/assessments/compare")
    public ResponseEntity<AssessmentComparisonDto> compareAssessments(
        @PathVariable("id") UUID targetId,
        @RequestParam(name = "previousAssessmentId", required = false) UUID previousAssessmentId,
        @RequestParam(name = "currentAssessmentId") UUID currentAssessmentId
    ) {
        return ResponseEntity.ok(comparisonService.compareAssessments(targetId, previousAssessmentId, currentAssessmentId));
    }

    @GetMapping("/{id}/regressions")
    public ResponseEntity<List<SecurityRegressionDto>> getRegressions(
        @PathVariable("id") UUID targetId,
        @RequestParam(name = "type", required = false) RegressionType type,
        @RequestParam(name = "confidence", required = false) RegressionConfidence confidence,
        @RequestParam(name = "status", required = false) RegressionStatus status
    ) {
        return ResponseEntity.ok(postureService.getRegressions(targetId, type, confidence, status));
    }

    @GetMapping("/{id}/regressions/{regressionId}")
    public ResponseEntity<SecurityRegressionDto> getRegressionDetails(
        @PathVariable("id") UUID targetId,
        @PathVariable("regressionId") UUID regressionId
    ) {
        return ResponseEntity.ok(postureService.getRegressionDetails(regressionId));
    }

    @GetMapping("/{id}/regression-summary")
    public ResponseEntity<RegressionSummaryDto> getRegressionSummary(@PathVariable("id") UUID targetId) {
        return ResponseEntity.ok(postureService.getRegressionSummary(targetId));
    }
}
