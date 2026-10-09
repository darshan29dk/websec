package com.globalshield.health;

import com.globalshield.ai.embedding.EmbeddingProvider;
import com.globalshield.ai.provider.LlmProvider;
import com.globalshield.ai.provider.LlmProviderType;
import com.globalshield.common.ApiResponse;
import com.globalshield.knowledge.KnowledgeDocumentRepository;
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
    private final LlmProvider llmProvider;
    private final EmbeddingProvider embeddingProvider;
    private final KnowledgeDocumentRepository knowledgeDocumentRepository;

    @GetMapping
    @Operation(summary = "Get system health", description = "Returns application, database, Flyway, and AI health status")
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

        String aiStatus = "AVAILABLE";
        if (llmProvider.getProviderType() == LlmProviderType.DISABLED) {
            aiStatus = "DISABLED";
        } else if (!llmProvider.isAvailable()) {
            aiStatus = "UNAVAILABLE";
        }
        components.put("ai_provider", Map.of(
            "status", aiStatus,
            "provider", llmProvider.getProviderName(),
            "model", llmProvider.getModel()
        ));

        components.put("embedding_provider", Map.of(
            "status", embeddingProvider.isAvailable() ? "AVAILABLE" : "UNAVAILABLE",
            "provider", embeddingProvider.getProviderName(),
            "dimension", embeddingProvider.getDimension()
        ));

        long docCount = 0;
        try {
            docCount = knowledgeDocumentRepository.count();
        } catch (Exception ignored) {}

        components.put("knowledge_index", Map.of(
            "status", "AVAILABLE",
            "documentCount", docCount
        ));

        boolean isUp = dbOk && flywayOk;

        HealthResponse healthResponse = HealthResponse.builder()
                .status(isUp ? "UP" : "DOWN")
                .applicationName("GlobalShield Enterprise Security Platform")
                .version("1.0.0-SNAPSHOT")
                .timestamp(Instant.now())
                .components(components)
                .build();

        return ResponseEntity.ok(ApiResponse.success(healthResponse));
    }
}
