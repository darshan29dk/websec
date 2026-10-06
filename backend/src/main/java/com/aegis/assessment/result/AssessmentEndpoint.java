package com.aegis.assessment.result;

import com.aegis.assessment.SecurityAssessment;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assessment_endpoints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SecurityAssessment assessment;

    @Column(nullable = false, length = 2048)
    private String url;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String method = "GET";

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "content_type")
    private String contentType;

    @Column(nullable = false)
    private String source;

    @Column(name = "discovered_at", nullable = false, updatable = false)
    private Instant discoveredAt;

    @PrePersist
    protected void onCreate() {
        if (discoveredAt == null) {
            discoveredAt = Instant.now();
        }
    }
}
