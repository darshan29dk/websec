package com.globalshield.target;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "target_scopes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TargetScope {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private SecurityTarget target;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false)
    private ScopeType scopeType;

    @Column(name = "scope_value", nullable = false, length = 512)
    private String scopeValue;

    @Column(nullable = false)
    @Builder.Default
    private boolean included = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
