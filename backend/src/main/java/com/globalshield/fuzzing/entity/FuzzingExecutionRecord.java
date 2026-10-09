package com.globalshield.fuzzing.entity;

import com.globalshield.finding.entity.FindingConfidence;
import com.globalshield.finding.entity.SecurityFinding;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fuzzing_execution_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingExecutionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private FuzzingCampaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private FuzzingTestCase testCase;

    @Column(name = "request_url", nullable = false, length = 1024)
    private String requestUrl;

    @Column(name = "request_method", nullable = false, length = 10)
    private String requestMethod;

    @Column(name = "request_headers_sanitized", columnDefinition = "TEXT")
    private String requestHeadersSanitized;

    @Column(name = "request_body_sanitized", columnDefinition = "TEXT")
    private String requestBodySanitized;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "response_headers_sanitized", columnDefinition = "TEXT")
    private String responseHeadersSanitized;

    @Column(name = "response_body_snippet", columnDefinition = "TEXT")
    private String responseBodySnippet;

    @Column(name = "response_hash", length = 64)
    private String responseHash;

    @Column(name = "baseline_status")
    private Integer baselineStatus;

    @Column(name = "baseline_diff_summary", columnDefinition = "TEXT")
    private String baselineDiffSummary;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_classification", nullable = false, length = 50)
    private TestResultClassification resultClassification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FindingConfidence confidence = FindingConfidence.MEDIUM;

    @Column(name = "anomaly_details", columnDefinition = "TEXT")
    private String anomalyDetails;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finding_id")
    private SecurityFinding finding;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt;

    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = Instant.now();
        }
    }
}
