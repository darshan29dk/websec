package com.aegis.attacksurface.entity;

import com.aegis.assessment.SecurityAssessment;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "web_endpoints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SecurityAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private WebApplication application;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "normalized_url", nullable = false, columnDefinition = "TEXT")
    private String normalizedUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String path;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String method = "GET";

    @Enumerated(EnumType.STRING)
    @Column(name = "endpoint_type", nullable = false)
    @Builder.Default
    private EndpointType endpointType = EndpointType.WEB;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "parameters_present", nullable = false)
    @Builder.Default
    private boolean parametersPresent = false;

    @Column(name = "authentication_observed", nullable = false)
    @Builder.Default
    private boolean authenticationObserved = false;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    @Builder.Default
    private String confidence = "HIGH";

    @Column(name = "first_seen_at", nullable = false)
    private Instant firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (firstSeenAt == null) firstSeenAt = now;
        if (lastSeenAt == null) lastSeenAt = now;
    }
}
