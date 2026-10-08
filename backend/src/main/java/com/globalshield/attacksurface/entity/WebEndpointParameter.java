package com.globalshield.attacksurface.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "web_endpoint_parameters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebEndpointParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endpoint_id", nullable = false)
    private WebEndpoint endpoint;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParameterLocation location;

    @Column(name = "parameter_type", nullable = false, length = 50)
    @Builder.Default
    private String parameterType = "STRING";

    @Column(name = "observed_value_hash", length = 64)
    private String observedValueHash;

    @Column(name = "required_observed", nullable = false)
    @Builder.Default
    private boolean requiredObserved = false;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    @Builder.Default
    private String confidence = "HIGH";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
