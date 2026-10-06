package com.aegis.system;

import com.aegis.assessment.dto.SecurityToolStatusResponse;
import com.aegis.common.ApiResponse;
import com.aegis.security.tool.ToolAdapter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@Tag(name = "System Management", description = "System status and security tools availability monitoring")
public class SecurityToolsController {

    private final List<ToolAdapter> toolAdapters;

    @GetMapping("/security-tools")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    @Operation(summary = "Get security tools status", description = "Return configuration and operational status for controlled security tools")
    public ResponseEntity<ApiResponse<List<SecurityToolStatusResponse>>> getSecurityToolsStatus() {
        List<SecurityToolStatusResponse> statuses = new ArrayList<>();

        for (ToolAdapter adapter : toolAdapters) {
            boolean available = adapter.isAvailable();
            statuses.add(SecurityToolStatusResponse.builder()
                    .tool(adapter.getToolName())
                    .configured(true)
                    .available(available)
                    .status(available ? "OPERATIONAL" : "NOT_AVAILABLE")
                    .build());
        }

        return ResponseEntity.ok(ApiResponse.success(statuses));
    }
}
