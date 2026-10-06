package com.aegis.health;

import com.aegis.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.flywaydb.core.Flyway;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
@Tag(name = "Health Check", description = "System health check endpoint")
public class HealthController {

    private final DataSource dataSource;
    private final Flyway flyway;

    @GetMapping
    @Operation(summary = "Get system health", description = "Returns application, database, and Flyway migration health status")
    public ResponseEntity<ApiResponse<HealthResponse>> checkHealth() {
        Map<String, Object> components = new HashMap<>();
        boolean dbOk = false;

        try (Connection conn = dataSource.getConnection()) {
            dbOk = conn.isValid(2);
            components.put("database", Map.of("status", dbOk ? "UP" : "DOWN", "databaseProduct", conn.getMetaData().getDatabaseProductName()));
        } catch (Exception e) {
            components.put("database", Map.of("status", "DOWN", "error", e.getMessage()));
        }

        boolean flywayOk = false;
        try {
            var migrationInfo = flyway.info().current();
            String currentVersion = migrationInfo != null ? migrationInfo.getVersion().getVersion() : "V1";
            flywayOk = true;
            components.put("migrations", Map.of("status", "UP", "currentVersion", currentVersion, "appliedCount", flyway.info().applied().length));
        } catch (Exception e) {
            components.put("migrations", Map.of("status", "DOWN", "error", e.getMessage()));
        }

        boolean isUp = dbOk && flywayOk;

        HealthResponse healthResponse = HealthResponse.builder()
                .status(isUp ? "UP" : "DOWN")
                .applicationName("AEGIS Web Security Platform")
                .version("1.0.0-SNAPSHOT")
                .timestamp(Instant.now())
                .components(components)
                .build();

        return ResponseEntity.ok(ApiResponse.success(healthResponse));
    }
}
