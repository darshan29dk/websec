package com.globalshield.target;

import com.globalshield.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "security_targets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    @Builder.Default
    private TargetType targetType = TargetType.WEB_URL;

    @Column(name = "primary_url", nullable = false, length = 1024)
    private String primaryUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TargetStatus status = TargetStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "target", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TargetScope> scopes = new ArrayList<>();

    @OneToMany(mappedBy = "target", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TargetAuthorization> authorizations = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
