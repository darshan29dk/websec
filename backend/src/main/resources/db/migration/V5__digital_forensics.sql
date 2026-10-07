-- ============================================================
-- AEGIS Phase 5 Migration: Digital Forensics & Evidence Reconstruction
-- ============================================================

-- 1. Forensic Cases
CREATE TABLE forensic_cases (
    id UUID PRIMARY KEY,
    uuid VARCHAR(64) NOT NULL UNIQUE,
    incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
    assessment_id UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    case_number VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Forensic Evidence
CREATE TABLE forensic_evidence (
    id UUID PRIMARY KEY,
    uuid VARCHAR(64) NOT NULL UNIQUE,
    case_id UUID NOT NULL REFERENCES forensic_cases(id) ON DELETE CASCADE,
    evidence_type VARCHAR(64) NOT NULL,
    source_type VARCHAR(64) NOT NULL,
    source_reference VARCHAR(255),
    event_time TIMESTAMP WITH TIME ZONE,
    collection_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    content_hash VARCHAR(128) NOT NULL,
    integrity_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED',
    confidence VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    classification VARCHAR(32) NOT NULL DEFAULT 'OBSERVED',
    provenance VARCHAR(255) NOT NULL,
    description TEXT,
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Evidence Provenance
CREATE TABLE evidence_provenance (
    id UUID PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES forensic_evidence(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    collector VARCHAR(255) NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    original_reference VARCHAR(255),
    sha256 VARCHAR(128) NOT NULL,
    transformation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. HTTP Forensic Events
CREATE TABLE http_forensic_events (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES forensic_cases(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES forensic_evidence(id) ON DELETE SET NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    source_ip VARCHAR(64),
    destination_ip VARCHAR(64),
    method VARCHAR(16) NOT NULL,
    scheme VARCHAR(16) NOT NULL DEFAULT 'http',
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 80,
    path VARCHAR(1024) NOT NULL,
    query_string TEXT,
    http_version VARCHAR(32),
    status_code INTEGER,
    request_headers TEXT,
    response_headers TEXT,
    request_body_reference VARCHAR(255),
    response_body_reference VARCHAR(255),
    user_agent VARCHAR(512),
    referer VARCHAR(512),
    content_type VARCHAR(128),
    content_length BIGINT,
    tls_version VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Network Forensic Events
CREATE TABLE network_forensic_events (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES forensic_cases(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES forensic_evidence(id) ON DELETE SET NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    source_ip VARCHAR(64),
    source_port INTEGER,
    destination_ip VARCHAR(64),
    destination_port INTEGER,
    protocol VARCHAR(32) NOT NULL,
    direction VARCHAR(32),
    connection_state VARCHAR(64),
    bytes_in BIGINT,
    bytes_out BIGINT,
    sensor_source VARCHAR(255),
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Application Forensic Events
CREATE TABLE application_forensic_events (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES forensic_cases(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES forensic_evidence(id) ON DELETE SET NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    application VARCHAR(128) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
    event_type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    request_id VARCHAR(128),
    session_id VARCHAR(128),
    user_id_reference VARCHAR(128),
    source_ip VARCHAR(64),
    endpoint VARCHAR(512),
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Forensic Timeline Events
CREATE TABLE forensic_timeline_events (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES forensic_cases(id) ON DELETE CASCADE,
    event_time TIMESTAMP WITH TIME ZONE,
    time_description VARCHAR(255),
    event_type VARCHAR(64) NOT NULL,
    source VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_id UUID REFERENCES forensic_evidence(id) ON DELETE SET NULL,
    confidence VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    sequence_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Forensic Attack Events (Reconstruction)
CREATE TABLE forensic_attack_events (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES forensic_cases(id) ON DELETE CASCADE,
    timeline_event_id UUID REFERENCES forensic_timeline_events(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE,
    source_ip VARCHAR(64),
    target_endpoint VARCHAR(512),
    http_method VARCHAR(16),
    status_code INTEGER,
    evidence_id UUID REFERENCES forensic_evidence(id) ON DELETE SET NULL,
    confidence VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    classification VARCHAR(32) NOT NULL DEFAULT 'OBSERVED',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_forensic_cases_target_id ON forensic_cases(target_id);
CREATE INDEX idx_forensic_cases_incident_id ON forensic_cases(incident_id);
CREATE INDEX idx_forensic_cases_status ON forensic_cases(status);

CREATE INDEX idx_forensic_evidence_case_id ON forensic_evidence(case_id);
CREATE INDEX idx_forensic_evidence_type ON forensic_evidence(evidence_type);

CREATE INDEX idx_http_forensic_case_id ON http_forensic_events(case_id);
CREATE INDEX idx_http_forensic_source_ip ON http_forensic_events(source_ip);

CREATE INDEX idx_network_forensic_case_id ON network_forensic_events(case_id);
CREATE INDEX idx_network_forensic_source_ip ON network_forensic_events(source_ip);

CREATE INDEX idx_app_forensic_case_id ON application_forensic_events(case_id);

CREATE INDEX idx_forensic_timeline_case_id ON forensic_timeline_events(case_id);
CREATE INDEX idx_forensic_timeline_event_time ON forensic_timeline_events(event_time);

CREATE INDEX idx_forensic_attack_case_id ON forensic_attack_events(case_id);
