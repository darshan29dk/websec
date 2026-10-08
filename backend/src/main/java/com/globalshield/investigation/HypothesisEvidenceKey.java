package com.globalshield.investigation;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class HypothesisEvidenceKey implements Serializable {

    private UUID hypothesisId;
    private UUID evidenceId;

    public HypothesisEvidenceKey() {
    }

    public HypothesisEvidenceKey(UUID hypothesisId, UUID evidenceId) {
        this.hypothesisId = hypothesisId;
        this.evidenceId = evidenceId;
    }

    public UUID getHypothesisId() {
        return hypothesisId;
    }
    public void setHypothesisId(UUID hypothesisId) {
        this.hypothesisId = hypothesisId;
    }

    public UUID getEvidenceId() {
        return evidenceId;
    }
    public void setEvidenceId(UUID evidenceId) {
        this.evidenceId = evidenceId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HypothesisEvidenceKey that = (HypothesisEvidenceKey) o;
        return Objects.equals(hypothesisId, that.hypothesisId) &&
               Objects.equals(evidenceId, that.evidenceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(hypothesisId, evidenceId);
    }
}
