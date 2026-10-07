-- ============================================================
-- AEGIS Phase 8: Controlled Retesting & Defense Validation
-- ============================================================

-- 1. Retests Table
CREATE TABLE IF NOT EXISTS retests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    finding_id UUID NOT NULL REFERENCES security_findings(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES security_assessments(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    requested_by VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reason TEXT,
    authorization_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_retests_finding ON retests(finding_id);
CREATE INDEX IF NOT EXISTS idx_retests_assessment ON retests(assessment_id);
CREATE INDEX IF NOT EXISTS idx_retests_target ON retests(target_id);
CREATE INDEX IF NOT EXISTS idx_retests_status ON retests(status);

-- 2. Retest Checks Table
CREATE TABLE IF NOT EXISTS retest_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    retest_id UUID NOT NULL REFERENCES retests(id) ON DELETE CASCADE,
    check_type VARCHAR(100) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    target_reference VARCHAR(255),
    endpoint_reference VARCHAR(255),
    parameter_reference VARCHAR(255),
    expected_condition TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_retest_checks_retest ON retest_checks(retest_id);

-- 3. Retest Evidence Table
CREATE TABLE IF NOT EXISTS retest_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    retest_id UUID NOT NULL REFERENCES retests(id) ON DELETE CASCADE,
    check_id UUID REFERENCES retest_checks(id) ON DELETE SET NULL,
    source VARCHAR(100) NOT NULL,
    evidence_type VARCHAR(100) NOT NULL,
    content_hash VARCHAR(64),
    evidence_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retest_evidence_retest ON retest_evidence(retest_id);
CREATE INDEX IF NOT EXISTS idx_retest_evidence_check ON retest_evidence(check_id);

-- 4. Defense Validations Table
CREATE TABLE IF NOT EXISTS defense_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    finding_id UUID NOT NULL REFERENCES security_findings(id) ON DELETE CASCADE,
    retest_id UUID NOT NULL REFERENCES retests(id) ON DELETE CASCADE,
    validation_status VARCHAR(50) NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    summary TEXT NOT NULL,
    validated_by VARCHAR(100) NOT NULL,
    validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defense_validations_finding ON defense_validations(finding_id);
CREATE INDEX IF NOT EXISTS idx_defense_validations_retest ON defense_validations(retest_id);
CREATE INDEX IF NOT EXISTS idx_defense_validations_status ON defense_validations(validation_status);

-- 5. Validation Results Table
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    validation_id UUID NOT NULL REFERENCES defense_validations(id) ON DELETE CASCADE,
    check_id UUID NOT NULL REFERENCES retest_checks(id) ON DELETE CASCADE,
    result_type VARCHAR(50) NOT NULL,
    expected_value TEXT,
    observed_value TEXT,
    comparison_result TEXT,
    confidence VARCHAR(20) NOT NULL,
    evidence_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_results_val ON validation_results(validation_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_check ON validation_results(check_id);

-- 6. Remediation Status History Table
CREATE TABLE IF NOT EXISTS remediation_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    finding_id UUID NOT NULL REFERENCES security_findings(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    reason TEXT,
    source VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remediation_status_hist_finding ON remediation_status_history(finding_id);
