-- ============================================================
-- GLOBALSHIELD: V17 Local Execution Agent, Notifications, and 3-Mode Remediation Policy
-- PostgreSQL & Supabase Compatible
-- Forward-only migration
-- ============================================================

-- 1. Table: security_agents (Secure Local Execution Agents)
CREATE TABLE IF NOT EXISTS security_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key_hash VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    hostname VARCHAR(255),
    ip_address VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED', -- REGISTERED, ONLINE, BUSY, OFFLINE, REVOKED
    capabilities TEXT NOT NULL DEFAULT '[]', -- JSON array of allowlisted tool names: ["Nmap", "Wireshark", "Volatility"]
    operating_system VARCHAR(64),
    agent_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revocation_reason TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_agents_status ON security_agents(status);
CREATE INDEX IF NOT EXISTS idx_security_agents_key_hash ON security_agents(agent_key_hash);

-- 2. Table: agent_jobs (Structured, allowlisted jobs dispatched to agents)
CREATE TABLE IF NOT EXISTS agent_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES security_agents(id) ON DELETE CASCADE,
    target_id UUID REFERENCES security_targets(id) ON DELETE SET NULL,
    tool_name VARCHAR(64) NOT NULL,
    operation VARCHAR(128) NOT NULL,
    parameters_json TEXT NOT NULL DEFAULT '{}', -- Strictly structured parameters, never raw shell commands
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED', -- QUEUED, DISPATCHED, RUNNING, COMPLETED, FAILED, CANCELLED, TIMEOUT
    timeout_seconds INT NOT NULL DEFAULT 300,
    scope_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    exit_code INT,
    stdout_sanitized TEXT,
    stderr_sanitized TEXT,
    evidence_reference VARCHAR(512),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_agent_id ON agent_jobs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON agent_jobs(status);

-- 3. Table: notification_configurations (Provider-agnostic email/alert configurations)
CREATE TABLE IF NOT EXISTS notification_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_type VARCHAR(32) NOT NULL DEFAULT 'SMTP', -- SMTP, CONSOLE_AUDIT_LOG, WEBHOOK
    smtp_host VARCHAR(255),
    smtp_port INT DEFAULT 587,
    smtp_username VARCHAR(255),
    smtp_password_encrypted VARCHAR(512),
    smtp_from VARCHAR(255) NOT NULL DEFAULT 'security-alerts@globalshield.internal',
    smtp_auth BOOLEAN NOT NULL DEFAULT TRUE,
    smtp_starttls BOOLEAN NOT NULL DEFAULT TRUE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    recipient_emails TEXT NOT NULL DEFAULT '[]', -- JSON array of email strings
    subscribed_events TEXT NOT NULL DEFAULT '["CRITICAL_FINDING_DETECTED", "HIGH_FINDING_DETECTED", "ASSESSMENT_COMPLETED", "ASSESSMENT_FAILED", "INCIDENT_ATTENTION_REQUIRED", "REMEDIATION_FAILURE", "VERIFICATION_FAILURE", "CONFIRMED_FIX", "REGRESSION_DETECTED", "TARGET_AUTHORIZATION_EXPIRING"]',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: notification_delivery_logs (Audit log of all notification attempts and idempotency)
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(512) NOT NULL,
    summary TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
    target_url VARCHAR(1024),
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED_TO_PROVIDER', -- SUBMITTED_TO_PROVIDER, DELIVERED, FAILED, SKIPPED
    provider_type VARCHAR(32) NOT NULL DEFAULT 'SMTP',
    provider_response TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_idempotency ON notification_delivery_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notification_logs_event_type ON notification_delivery_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_delivery_logs(status);

-- 5. Extend remediation_plans for 3-Mode Remediation Policy
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS remediation_mode VARCHAR(32) NOT NULL DEFAULT 'GUIDANCE_ONLY'; -- GUIDANCE_ONLY, REVIEWABLE_ASSISTED_PATCH, CONTROLLED_AUTOMATED
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW'; -- LOW, MEDIUM, HIGH, CRITICAL
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS approval_status VARCHAR(32) NOT NULL DEFAULT 'NOT_REQUIRED'; -- NOT_REQUIRED, PENDING_APPROVAL, APPROVED, REJECTED
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS reviewable_patch_diff TEXT;
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS verification_criteria TEXT;
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS automated_action_type VARCHAR(64);
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS is_automated_executable BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS execution_log TEXT;
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE remediation_plans ADD COLUMN IF NOT EXISTS execution_status VARCHAR(32); -- PENDING, EXECUTED, FAILED
