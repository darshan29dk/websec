-- AEGIS Phase 1 Initial Database Schema Migration
-- Compatible with PostgreSQL and Supabase PostgreSQL

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'ANALYST', 'VIEWER')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

CREATE TABLE security_targets (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL DEFAULT 'WEB_URL' CHECK (target_type IN ('WEB_URL')),
    primary_url VARCHAR(1024) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'ARCHIVED')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_targets_status ON security_targets(status);
CREATE INDEX idx_security_targets_created_by ON security_targets(created_by);

CREATE TABLE target_scopes (
    id UUID PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    scope_type VARCHAR(50) NOT NULL CHECK (scope_type IN ('DOMAIN', 'URL', 'IP', 'PATH')),
    scope_value VARCHAR(512) NOT NULL,
    included BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_target_scopes_target_id ON target_scopes(target_id);

CREATE TABLE target_authorizations (
    id UUID PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    authorization_type VARCHAR(50) NOT NULL CHECK (authorization_type IN ('OWNER', 'WRITTEN_PERMISSION', 'LAB', 'OTHER')),
    authorization_statement TEXT NOT NULL,
    authorized_by UUID NOT NULL REFERENCES users(id),
    authorization_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_target_auth_target_id ON target_authorizations(target_id);
CREATE INDEX idx_target_auth_exp ON target_authorizations(expiration_date);

CREATE TABLE assessment_profiles (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    profile_type VARCHAR(50) NOT NULL UNIQUE CHECK (profile_type IN ('PASSIVE', 'STANDARD_AUTHORIZED', 'COMPREHENSIVE_AUTHORIZED')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security_assessments (
    id UUID PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES security_targets(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES assessment_profiles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('DRAFT', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    requested_by UUID NOT NULL REFERENCES users(id),
    authorization_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_target_id ON security_assessments(target_id);
CREATE INDEX idx_assessments_status ON security_assessments(status);
CREATE INDEX idx_assessments_requested_by ON security_assessments(requested_by);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);

-- Initial Assessment Profiles Seed Data
INSERT INTO assessment_profiles (id, name, description, profile_type, enabled, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Passive Assessment', 'Non-intrusive passive security analysis including headers, TLS configurations, and DNS records.', 'PASSIVE', TRUE, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000002', 'Standard Authorized Assessment', 'Standard security verification of application endpoints, SSL/TLS, and web configuration controls.', 'STANDARD_AUTHORIZED', TRUE, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000003', 'Comprehensive Authorized Assessment', 'In-depth assessment profile for registered web application targets with full authorization scope.', 'COMPREHENSIVE_AUTHORIZED', TRUE, CURRENT_TIMESTAMP);
