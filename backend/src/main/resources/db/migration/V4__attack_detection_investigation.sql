-- AEGIS Phase 4: Attack Detection & Investigation Schema

-- 1. Security Events Table
CREATE TABLE security_events (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source_ip VARCHAR(45),
    source_ip_confidence VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    source_port INTEGER,
    destination_ip VARCHAR(45),
    destination_port INTEGER,
    http_method VARCHAR(10),
    url VARCHAR(2048),
    path VARCHAR(1024),
    query_parameters TEXT,
    status_code INTEGER,
    user_agent TEXT,
    request_size BIGINT,
    response_size BIGINT,
    protocol VARCHAR(20),
    event_source VARCHAR(50) NOT NULL,
    raw_reference VARCHAR(512),
    normalized_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sec_events_target ON security_events(target_id);
CREATE INDEX idx_sec_events_type ON security_events(event_type);
CREATE INDEX idx_sec_events_time ON security_events(event_time);
CREATE INDEX idx_sec_events_src_ip ON security_events(source_ip);

-- 2. HTTP Events Table
CREATE TABLE http_events (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    security_event_id UUID NOT NULL UNIQUE REFERENCES security_events(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source_ip VARCHAR(45),
    method VARCHAR(10) NOT NULL,
    scheme VARCHAR(10) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    path VARCHAR(1024) NOT NULL,
    query_string TEXT,
    status_code INTEGER,
    request_headers TEXT,
    response_headers TEXT,
    request_body_reference TEXT,
    response_body_reference TEXT,
    user_agent TEXT,
    content_type VARCHAR(255),
    content_length BIGINT,
    tls_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_http_events_target ON http_events(target_id);
CREATE INDEX idx_http_events_ts ON http_events(timestamp);
CREATE INDEX idx_http_events_path ON http_events(path);
CREATE INDEX idx_http_events_src_ip ON http_events(source_ip);

-- 3. Network Events Table
CREATE TABLE network_events (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    security_event_id UUID NOT NULL UNIQUE REFERENCES security_events(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source_ip VARCHAR(45),
    source_port INTEGER,
    destination_ip VARCHAR(45),
    destination_port INTEGER,
    protocol VARCHAR(20) NOT NULL,
    direction VARCHAR(20),
    bytes_in BIGINT,
    bytes_out BIGINT,
    connection_state VARCHAR(50),
    event_source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_net_events_target ON network_events(target_id);
CREATE INDEX idx_net_events_ts ON network_events(timestamp);
CREATE INDEX idx_net_events_src_ip ON network_events(source_ip);

-- 4. Detection Rules Table
CREATE TABLE detection_rules (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    conditions TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 5. Detection Matches Table
CREATE TABLE detection_matches (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    rule_id UUID NOT NULL REFERENCES detection_rules(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES security_events(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    matched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    evidence TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_det_matches_target ON detection_matches(target_id);
CREATE INDEX idx_det_matches_time ON detection_matches(matched_at);
CREATE INDEX idx_det_matches_status ON detection_matches(status);

-- 6. Security Incidents Table
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    correlation_key VARCHAR(512) NOT NULL,
    source_ip VARCHAR(45),
    source_ip_confidence VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    first_observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_incidents_target ON security_incidents(target_id);
CREATE INDEX idx_incidents_status ON security_incidents(status);
CREATE INDEX idx_incidents_time ON security_incidents(first_observed_at);
CREATE INDEX idx_incidents_corr_key ON security_incidents(correlation_key);

-- 7. Investigations Table
CREATE TABLE investigations (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    incident_id UUID NOT NULL UNIQUE REFERENCES security_incidents(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    primary_hypothesis TEXT,
    conclusion VARCHAR(30),
    confidence VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Investigation Hypotheses Table
CREATE TABLE investigation_hypotheses (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PROPOSED',
    confidence VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 9. Investigation Evidence Table
CREATE TABLE investigation_evidence (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    integrity_hash VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 10. Hypothesis Evidence Relationship Table
CREATE TABLE hypothesis_evidence (
    hypothesis_id UUID NOT NULL REFERENCES investigation_hypotheses(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL REFERENCES investigation_evidence(id) ON DELETE CASCADE,
    relationship VARCHAR(20) NOT NULL DEFAULT 'SUPPORTING',
    PRIMARY KEY (hypothesis_id, evidence_id)
);

-- 11. Timeline Events Table
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES security_events(id) ON DELETE SET NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) NOT NULL,
    confidence VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_timeline_inv_id ON timeline_events(investigation_id);
CREATE INDEX idx_timeline_time ON timeline_events(event_time);

-- 12. Attack Chains Table
CREATE TABLE attack_chains (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    investigation_id UUID NOT NULL UNIQUE REFERENCES investigations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    confidence VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 13. Attack Chain Nodes Table
CREATE TABLE attack_chain_nodes (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    attack_chain_id UUID NOT NULL REFERENCES attack_chains(id) ON DELETE CASCADE,
    node_type VARCHAR(30) NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(255),
    label VARCHAR(255) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 14. Attack Chain Edges Table
CREATE TABLE attack_chain_edges (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    attack_chain_id UUID NOT NULL REFERENCES attack_chains(id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES attack_chain_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES attack_chain_nodes(id) ON DELETE CASCADE,
    relationship VARCHAR(30) NOT NULL,
    confidence VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 15. Investigation Notes Table
CREATE TABLE investigation_notes (
    id UUID PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    author_id UUID,
    author_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Seed Default Detection Rules
INSERT INTO detection_rules (id, name, description, event_type, severity, confidence, conditions, enabled, created_at, updated_at)
VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'SQL Injection Pattern',
    'Request contains indicators consistent with SQL injection probing.',
    'HTTP_REQUEST',
    'HIGH',
    'HIGH',
    '{"type":"REGEX_MATCH","target_fields":["url","query_parameters","request_headers"],"patterns":["(?i)(\\bunion\\b.*\\bselect\\b|\\bselect\\b.*\\bfrom\\b|\\bexec(\\s|\\+)+(s|x)p|\\bdrop\\b.*\\btable\\b|\\binsert\\b.*\\binto\\b|''\\s*or\\s*''1''\\s*=\\s*''1|''\\s*or\\s*1=1|--|#|/\\*.*\\*/|WAITFOR\\s+DELAY)"]}',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '10000000-0000-0000-0000-000000000002',
    'XSS Probe',
    'Request contains indicators consistent with cross-site scripting payload probing.',
    'HTTP_REQUEST',
    'MEDIUM',
    'HIGH',
    '{"type":"REGEX_MATCH","target_fields":["url","query_parameters","request_headers"],"patterns":["(?i)(<script.*?>|javascript:|onload\\s*=|onerror\\s*=|eval\\(|alert\\(|document\\.cookie|<!--#exec)"]}',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '10000000-0000-0000-0000-000000000003',
    'Path Traversal Probe',
    'Request contains indicators consistent with directory traversal probing.',
    'HTTP_REQUEST',
    'HIGH',
    'HIGH',
    '{"type":"REGEX_MATCH","target_fields":["path","query_parameters"],"patterns":["(?i)(\\.\\./|\\.\\.\\\\|%2e%2e%2f|%2e%2e/|\\.\\.%2f|%2e%2e%5c|/etc/passwd|c:\\\\windows\\\\system32)"]}',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '10000000-0000-0000-0000-000000000004',
    'Command Injection Probe',
    'Request contains indicators consistent with OS command injection probing.',
    'HTTP_REQUEST',
    'CRITICAL',
    'HIGH',
    '{"type":"REGEX_MATCH","target_fields":["query_parameters","path"],"patterns":["(?i)(;|\\|\\||&&|`\\s*whoami|`\\s*id|`\\s*cat|cmd\\.exe|/bin/sh|/bin/bash)"]}',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '10000000-0000-0000-0000-000000000005',
    'Sensitive Endpoint Probing',
    'Request attempts to access sensitive system management or configuration endpoints.',
    'HTTP_REQUEST',
    'MEDIUM',
    'MEDIUM',
    '{"type":"PATH_CONTAINS","target_fields":["path"],"patterns":["/admin","/.env","/config","/backup","/debug","/actuator","/.git"]}',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '10000000-0000-0000-0000-000000000006',
    'Repeated Authentication Failures',
    'Detection rule for repeated failed authentication attempts.',
    'AUTHENTICATION_EVENT',
    'MEDIUM',
    'MEDIUM',
    '{"type":"STATUS_CODE_COUNT","status_code":401,"threshold":5}',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '10000000-0000-0000-0000-000000000007',
    'Unusual HTTP Error Burst',
    'Detection rule for abnormal rate of 4xx/5xx responses within telemetry stream.',
    'HTTP_RESPONSE',
    'LOW',
    'LOW',
    '{"type":"STATUS_CODE_BURST","threshold":10}',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
