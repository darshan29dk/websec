package com.globalshield.attackchain;

import com.globalshield.detection.DetectionConfidence;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attack_chain_edges")
public class AttackChainEdge {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(name = "attack_chain_id", nullable = false)
    private UUID attackChainId;

    @Column(name = "from_node_id", nullable = false)
    private UUID fromNodeId;

    @Column(name = "to_node_id", nullable = false)
    private UUID toNodeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttackEdgeRelationship relationship;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DetectionConfidence confidence = DetectionConfidence.MEDIUM;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public AttackChainEdge() {
    }

    @PrePersist
    public void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (uuid == null) {
            uuid = id.toString();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }
    public void setId(UUID id) {
        this.id = id;
    }

    public String getUuid() {
        return uuid;
    }
    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public UUID getAttackChainId() {
        return attackChainId;
    }
    public void setAttackChainId(UUID attackChainId) {
        this.attackChainId = attackChainId;
    }

    public UUID getFromNodeId() {
        return fromNodeId;
    }
    public void setFromNodeId(UUID fromNodeId) {
        this.fromNodeId = fromNodeId;
    }

    public UUID getToNodeId() {
        return toNodeId;
    }
    public void setToNodeId(UUID toNodeId) {
        this.toNodeId = toNodeId;
    }

    public AttackEdgeRelationship getRelationship() {
        return relationship;
    }
    public void setRelationship(AttackEdgeRelationship relationship) {
        this.relationship = relationship;
    }

    public DetectionConfidence getConfidence() {
        return confidence;
    }
    public void setConfidence(DetectionConfidence confidence) {
        this.confidence = confidence;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
