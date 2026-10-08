-- ============================================================
-- GLOBALSHIELD: Defense & Tooling Expansion
-- ============================================================

-- 1. Security Tools Status Table
CREATE TABLE IF NOT EXISTS security_tools_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name VARCHAR(50) NOT NULL UNIQUE,
    version VARCHAR(50),
    executable_path VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_CONFIGURED',
    supported_operations TEXT,
    configuration_status TEXT,
    last_checked_at TIMESTAMP WITH TIME ZONE
);

-- 2. Security Telemetry Sources Table
CREATE TABLE IF NOT EXISTS security_telemetry_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    endpoint_url VARCHAR(512),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_ingested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. WAF Events Table
CREATE TABLE IF NOT EXISTS waf_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES security_targets(id) ON DELETE SET NULL,
    rule_id VARCHAR(100),
    client_ip VARCHAR(45),
    action_taken VARCHAR(50) NOT NULL,
    request_uri VARCHAR(512),
    raw_payload TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waf_events_target ON waf_events(target_id);

-- 4. System Detection Rules Table
CREATE TABLE IF NOT EXISTS system_detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    pattern VARCHAR(512) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
