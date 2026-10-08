package com.globalshield.audit;

import com.globalshield.common.ApiResponse;
import com.globalshield.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Logging", description = "Query security audit trail records")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_ANALYST', 'ADMIN', 'ANALYST')")
    @Operation(summary = "Get audit events", description = "Returns paginated and filtered audit events")
    public ResponseEntity<ApiResponse<PageResponse<AuditEventResponse>>> getAuditEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String user,
            @RequestParam(required = false) AuditEventType eventType,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String search) {

        PageResponse<AuditEventResponse> result = auditService.getAuditEvents(page, size, user, eventType, resourceType, search);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
