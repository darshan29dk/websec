package com.globalshield.target;

import com.globalshield.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "target_authorizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TargetAuthorization {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private SecurityTarget target;

    @Enumerated(EnumType.STRING)
    @Column(name = "authorization_type", nullable = false)
    private AuthorizationType authorizationType;

    @Column(name = "authorization_statement", nullable = false, columnDefinition = "TEXT")
    private String authorizationStatement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorized_by", nullable = false)
    private User authorizedBy;

    @Column(name = "authorization_date", nullable = false)
    private LocalDate authorizationDate;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public boolean isValid() {
        LocalDate now = LocalDate.now();
        return (authorizationDate == null || !authorizationDate.isAfter(now))
                && (expirationDate == null || !expirationDate.isBefore(now));
    }
}
