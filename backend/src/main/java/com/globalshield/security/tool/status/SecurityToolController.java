package com.globalshield.security.tool.status;

import com.globalshield.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/security-tools")
@RequiredArgsConstructor
public class SecurityToolController {

    private final SecurityToolService toolService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SecurityToolStatus>>> getAllToolStatuses() {
        List<SecurityToolStatus> statuses = toolService.getAllToolStatuses();
        return ResponseEntity.ok(ApiResponse.success("Security tool statuses retrieved successfully", statuses));
    }

    @GetMapping("/{toolName}/health")
    public ResponseEntity<ApiResponse<SecurityToolStatus>> checkToolHealth(@PathVariable String toolName) {
        SecurityToolStatus status = toolService.checkToolHealth(toolName);
        return ResponseEntity.ok(ApiResponse.success("Tool health checked successfully", status));
    }

    @GetMapping("/{toolName}")
    public ResponseEntity<ApiResponse<SecurityToolStatus>> getToolByName(@PathVariable String toolName) {
        SecurityToolStatus status = toolService.getToolByName(toolName);
        return ResponseEntity.ok(ApiResponse.success("Tool details retrieved successfully", status));
    }

    @PostMapping("/check-all")
    public ResponseEntity<ApiResponse<List<SecurityToolStatus>>> recheckAllTools() {
        List<SecurityToolStatus> statuses = toolService.initializeAndCheckAllTools();
        return ResponseEntity.ok(ApiResponse.success("All security tools re-checked successfully", statuses));
    }
}
