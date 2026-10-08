package com.globalshield.detection;

import com.globalshield.common.ApiResponse;
import com.globalshield.common.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/detections")
public class DetectionController {

    private final DetectionMatchRepository matchRepository;
    private final DetectionRuleRepository ruleRepository;

    public DetectionController(DetectionMatchRepository matchRepository,
                               DetectionRuleRepository ruleRepository) {
        this.matchRepository = matchRepository;
        this.ruleRepository = ruleRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DetectionMatch>>> getDetections(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID targetId,
            @RequestParam(required = false) MatchStatus status
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "matchedAt"));
        Page<DetectionMatch> matchPage;
        if (targetId != null) {
            matchPage = matchRepository.findByTargetId(targetId, pageable);
        } else if (status != null) {
            matchPage = matchRepository.findByStatus(status, pageable);
        } else {
            matchPage = matchRepository.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(matchPage)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DetectionMatch>> getDetectionById(@PathVariable UUID id) {
        DetectionMatch match = matchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Detection match not found with ID: " + id));
        return ResponseEntity.ok(ApiResponse.success(match));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DetectionMatch>> updateDetectionStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        DetectionMatch match = matchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Detection match not found with ID: " + id));
        
        String newStatusStr = body.get("status");
        if (newStatusStr != null) {
            match.setStatus(MatchStatus.valueOf(newStatusStr.toUpperCase()));
            matchRepository.save(match);
        }
        return ResponseEntity.ok(ApiResponse.success("Detection status updated successfully", match));
    }

    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<List<DetectionRule>>> getDetectionRules() {
        List<DetectionRule> rules = ruleRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(rules));
    }
}
