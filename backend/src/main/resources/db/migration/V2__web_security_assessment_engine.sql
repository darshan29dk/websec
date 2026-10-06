-- AEGIS Phase 2 Web Security Assessment Engine Migration
-- PostgreSQL & Supabase Compatible

-- 1. Extend security_assessments table
ALTER TABLE security_assessments ADD COLUMN IF NOT EXISTS progress_percent INT NOT NULL DEFAULT 0;
ALTER TABLE security_assessments ADD COLUMN IF NOT EXISTS current_stage VARCHAR(100);
ALTER TABLE security_assessments ADD COLUMN IF NOT EXISTS queued_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE security_assessments ADD COLUMN IF NOT EXISTS validation_started_at TIMESTAMP WITH TIME ZONE;

-- 2. Create tool_executions table
CREATE TABLE tool_executions (
    id UUID PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES security_assessments(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    stage VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED', 'NOT_AVAILABLE')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms BIGINT,
    exit_code INT,
    stdout_output TEXT,
    stderr_output TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tool_exec_assessment_id ON tool_executions(assessment_id);
CREATE INDEX idx_tool_exec_status ON tool_executions(status);
CREATE INDEX idx_tool_exec_started_at ON tool_executions(started_at);

-- 3. Create assessment_assets table
CREATE TABLE assessment_assets (
    id UUID PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES security_assessments(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('HOST', 'IP', 'PORT', 'SERVICE', 'TECHNOLOGY', 'WEB_SERVER', 'DOMAIN')),
    "value" VARCHAR(512) NOT NULL,
    source VARCHAR(100) NOT NULL,
    confidence VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessment_assets_assessment_id ON assessment_assets(assessment_id);
CREATE INDEX idx_assessment_assets_type ON assessment_assets(asset_type);

-- 4. Create assessment_endpoints table
CREATE TABLE assessment_endpoints (
    id UUID PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES security_assessments(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    method VARCHAR(20) NOT NULL DEFAULT 'GET',
    status_code INT,
    content_type VARCHAR(255),
    source VARCHAR(100) NOT NULL,
    discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessment_endpoints_assessment_id ON assessment_endpoints(assessment_id);

-- 5. Create assessment_observations table
CREATE TABLE assessment_observations (
    id UUID PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES security_assessments(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    confidence VARCHAR(50) NOT NULL CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
    source VARCHAR(100) NOT NULL,
    evidence TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessment_obs_assessment_id ON assessment_observations(assessment_id);
CREATE INDEX idx_assessment_obs_severity ON assessment_observations(severity);
