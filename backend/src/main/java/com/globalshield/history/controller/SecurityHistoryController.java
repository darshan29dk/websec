package com.globalshield.history.controller;

import com.globalshield.history.dto.SecurityHistoryTimelineDto;
import com.globalshield.history.service.SecurityHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/targets")
@RequiredArgsConstructor
public class SecurityHistoryController {

    private final SecurityHistoryService historyService;

    @GetMapping("/{id}/security-history")
    public ResponseEntity<SecurityHistoryTimelineDto> getTargetSecurityHistory(@PathVariable("id") UUID targetId) {
        return ResponseEntity.ok(historyService.getTargetSecurityHistory(targetId));
    }
}
