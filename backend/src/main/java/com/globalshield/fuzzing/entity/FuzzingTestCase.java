package com.globalshield.fuzzing.entity;

import com.globalshield.attacksurface.entity.WebEndpoint;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fuzzing_test_cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingTestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private FuzzingCampaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endpoint_id")
    private WebEndpoint endpoint;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false)
    private String name;

    @Column(name = "http_method", nullable = false, length = 10)
    @Builder.Default
    private String httpMethod = "GET";

    @Column(name = "target_url", nullable = false, length = 1024)
    private String targetUrl;

    @Column(name = "parameter_name", length = 100)
    private String parameterName;

    @Column(name = "payload_type", nullable = false, length = 50)
    private String payloadType;

    @Column(name = "test_payload", columnDefinition = "TEXT")
    private String testPayload;

    @Column(name = "baseline_payload", columnDefinition = "TEXT")
    private String baselinePayload;

    @Column(name = "execution_order", nullable = false)
    @Builder.Default
    private Integer executionOrder = 0;

    @Column(name = "is_multi_step", nullable = false)
    @Builder.Default
    private boolean multiStep = false;

    @Column(name = "step_index", nullable = false)
    @Builder.Default
    private Integer stepIndex = 0;

    @Column(name = "preconditions", columnDefinition = "TEXT")
    private String preconditions;

    @Column(name = "stop_condition", length = 100)
    private String stopCondition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private TestCaseStatus status = TestCaseStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
