-- ============================================================
-- AEGIS Phase 10: Reporting, Continuous Monitoring & Security History
-- ============================================================

-- 1. Security Reports Table
CREATE TABLE IF NOT EXISTS security_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_id UUID REFERENCES security_targets(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
    generated_by VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    format VARCHAR(20) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    storage_reference VARCHAR(512),
    checksum VARCHAR(64),
    file_size BIGINT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON security_reports(target_id);
CREATE INDEX IF NOT EXISTS idx_reports_assessment ON security_reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON security_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON security_reports(report_type);

-- 2. Monitoring Configurations Table
CREATE TABLE IF NOT EXISTS monitoring_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES assessment_profiles(id) ON DELETE SET NULL,
    frequency VARCHAR(30) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_status VARCHAR(50) NOT NULL DEFAULT 'IDLE',
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_target ON monitoring_configurations(target_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_enabled ON monitoring_configurations(enabled);
CREATE INDEX IF NOT EXISTS idx_monitoring_next_run ON monitoring_configurations(next_run_at);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(36) NOT NULL UNIQUE,
    user_email VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
