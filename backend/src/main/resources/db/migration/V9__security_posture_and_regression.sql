-- ============================================================
-- AEGIS Phase 9: Security Posture & Regression
-- ============================================================

-- 1. Security Posture Snapshots Table
CREATE TABLE IF NOT EXISTS security_posture_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    overall_score INT NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    score_status VARCHAR(50) NOT NULL,
    previous_score INT,
    score_delta INT,
    score_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posture_snapshots_target ON security_posture_snapshots(target_id);
CREATE INDEX IF NOT EXISTS idx_posture_snapshots_assessment ON security_posture_snapshots(assessment_id);
CREATE INDEX IF NOT EXISTS idx_posture_snapshots_calc_at ON security_posture_snapshots(calculated_at);

-- 2. Security Posture Dimensions Table
CREATE TABLE IF NOT EXISTS security_posture_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    snapshot_id UUID NOT NULL REFERENCES security_posture_snapshots(id) ON DELETE CASCADE,
    dimension VARCHAR(50) NOT NULL,
    score INT,
    status VARCHAR(50) NOT NULL,
    evidence_count INT NOT NULL DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posture_dimensions_snapshot ON security_posture_dimensions(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_posture_dimensions_dim ON security_posture_dimensions(dimension);

-- 3. Posture Score Factors Table
CREATE TABLE IF NOT EXISTS posture_score_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    snapshot_id UUID NOT NULL REFERENCES security_posture_snapshots(id) ON DELETE CASCADE,
    dimension VARCHAR(50) NOT NULL,
    factor_type VARCHAR(100) NOT NULL,
    factor_name VARCHAR(255) NOT NULL,
    impact INT NOT NULL,
    weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    evidence_reference VARCHAR(255),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posture_factors_snapshot ON posture_score_factors(snapshot_id);

-- 4. Security Regressions Table
CREATE TABLE IF NOT EXISTS security_regressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    previous_assessment_id UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    current_assessment_id UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    finding_fingerprint VARCHAR(64) NOT NULL,
    previous_finding_id UUID REFERENCES security_findings(id) ON DELETE SET NULL,
    current_finding_id UUID REFERENCES security_findings(id) ON DELETE SET NULL,
    regression_type VARCHAR(50) NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    explanation TEXT,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_regressions_target ON security_regressions(target_id);
CREATE INDEX IF NOT EXISTS idx_security_regressions_curr_assess ON security_regressions(current_assessment_id);
CREATE INDEX IF NOT EXISTS idx_security_regressions_prev_assess ON security_regressions(previous_assessment_id);
CREATE INDEX IF NOT EXISTS idx_security_regressions_fingerprint ON security_regressions(finding_fingerprint);
CREATE INDEX IF NOT EXISTS idx_security_regressions_type ON security_regressions(regression_type);
