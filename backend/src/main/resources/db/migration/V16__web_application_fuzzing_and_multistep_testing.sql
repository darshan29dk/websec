-- ============================================================
-- GLOBALSHIELD: V16 Web Application Fuzzing and Multi-Step Testing
-- PostgreSQL & Supabase Compatible
-- ============================================================

-- 1. Fuzzing Campaigns Table
CREATE TABLE IF NOT EXISTS fuzzing_campaigns (
    id UUID PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    profile VARCHAR(50) NOT NULL CHECK (profile IN ('PASSIVE_BASELINE', 'SAFE_ACTIVE_FUZZ', 'MULTI_STEP_SEQUENCE', 'AUTH_SESSION_FUZZ')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED')),
    target_scope_snapshot VARCHAR(1024),
    rate_limit_rps INT NOT NULL DEFAULT 5,
    max_requests INT NOT NULL DEFAULT 100,
    timeout_ms INT NOT NULL DEFAULT 10000,
    concurrency INT NOT NULL DEFAULT 1,
    categories VARCHAR(512),
    custom_headers TEXT,
    total_test_cases INT NOT NULL DEFAULT 0,
    executed_test_cases INT NOT NULL DEFAULT 0,
    findings_count INT NOT NULL DEFAULT 0,
    suspicious_count INT NOT NULL DEFAULT 0,
    duration_ms BIGINT DEFAULT 0,
    error_message TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_fuzzing_campaigns_target_id ON fuzzing_campaigns(target_id);
CREATE INDEX IF NOT EXISTS idx_fuzzing_campaigns_status ON fuzzing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_fuzzing_campaigns_created_at ON fuzzing_campaigns(created_at);

-- 2. Fuzzing Test Cases Table
CREATE TABLE IF NOT EXISTS fuzzing_test_cases (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES fuzzing_campaigns(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES web_endpoints(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL DEFAULT 'GET',
    target_url VARCHAR(1024) NOT NULL,
    parameter_name VARCHAR(100),
    payload_type VARCHAR(50) NOT NULL,
    test_payload TEXT,
    baseline_payload TEXT,
    execution_order INT NOT NULL DEFAULT 0,
    is_multi_step BOOLEAN NOT NULL DEFAULT FALSE,
    step_index INT NOT NULL DEFAULT 0,
    preconditions TEXT,
    stop_condition VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'BLOCKED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fuzzing_test_cases_campaign_id ON fuzzing_test_cases(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fuzzing_test_cases_category ON fuzzing_test_cases(category);
CREATE INDEX IF NOT EXISTS idx_fuzzing_test_cases_status ON fuzzing_test_cases(status);

-- 3. Fuzzing Execution Records Table
CREATE TABLE IF NOT EXISTS fuzzing_execution_records (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES fuzzing_campaigns(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES fuzzing_test_cases(id) ON DELETE CASCADE,
    request_url VARCHAR(1024) NOT NULL,
    request_method VARCHAR(10) NOT NULL,
    request_headers_sanitized TEXT,
    request_body_sanitized TEXT,
    response_status INT,
    response_time_ms BIGINT,
    response_headers_sanitized TEXT,
    response_body_snippet TEXT,
    response_hash VARCHAR(64),
    baseline_status INT,
    baseline_diff_summary TEXT,
    result_classification VARCHAR(50) NOT NULL CHECK (result_classification IN ('PASSED', 'SUSPICIOUS', 'VULNERABILITY_CONFIRMED', 'ERROR', 'SKIPPED', 'BLOCKED')),
    confidence VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH', 'CERTAIN')),
    anomaly_details TEXT,
    finding_id UUID REFERENCES security_findings(id) ON DELETE SET NULL,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fuzzing_records_campaign_id ON fuzzing_execution_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fuzzing_records_test_case_id ON fuzzing_execution_records(test_case_id);
CREATE INDEX IF NOT EXISTS idx_fuzzing_records_classification ON fuzzing_execution_records(result_classification);

-- 4. Fuzzing Coverage Results Table (OWASP Top 10)
CREATE TABLE IF NOT EXISTS fuzzing_coverage_results (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES fuzzing_campaigns(id) ON DELETE CASCADE,
    owasp_category VARCHAR(10) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    supported_checks_count INT NOT NULL DEFAULT 0,
    executed_checks_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL CHECK (status IN ('NOT_SUPPORTED', 'NOT_CONFIGURED', 'NOT_RUN', 'BLOCKED', 'PASSED', 'SUSPECTED', 'CONFIRMED')),
    limitations_notes TEXT,
    tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fuzzing_coverage_campaign_id ON fuzzing_coverage_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fuzzing_coverage_category ON fuzzing_coverage_results(owasp_category);

-- 5. Fuzzing Multi-Step Sequences Table
CREATE TABLE IF NOT EXISTS fuzzing_multi_step_sequences (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES fuzzing_campaigns(id) ON DELETE CASCADE,
    sequence_name VARCHAR(255) NOT NULL,
    description TEXT,
    total_steps INT NOT NULL DEFAULT 1,
    current_step INT NOT NULL DEFAULT 0,
    session_state_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'HALTED', 'FAILED')),
    halt_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fuzzing_sequences_campaign_id ON fuzzing_multi_step_sequences(campaign_id);
