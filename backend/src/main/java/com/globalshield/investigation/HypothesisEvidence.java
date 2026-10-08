package com.globalshield.investigation;

import jakarta.persistence.*;

@Entity
@Table(name = "hypothesis_evidence")
public class HypothesisEvidence {

    @EmbeddedId
    private HypothesisEvidenceKey id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HypothesisRelationship relationship = HypothesisRelationship.SUPPORTING;

    public HypothesisEvidence() {
    }

    public HypothesisEvidence(HypothesisEvidenceKey id, HypothesisRelationship relationship) {
        this.id = id;
        this.relationship = relationship;
    }

    public HypothesisEvidenceKey getId() {
        return id;
    }
    public void setId(HypothesisEvidenceKey id) {
        this.id = id;
    }

    public HypothesisRelationship getRelationship() {
        return relationship;
    }
    public void setRelationship(HypothesisRelationship relationship) {
        this.relationship = relationship;
    }
}
