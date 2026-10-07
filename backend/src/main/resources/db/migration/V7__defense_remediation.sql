-- Flyway migration V7: Defense & Remediation Engine
-- AEGIS Web Security Platform Phase 7

CREATE TABLE defense_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    implementation_guidance TEXT,
    validation_guidance TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE defense_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    finding_id UUID,
    investigation_id UUID,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    root_cause VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN',
    root_cause_explanation TEXT,
    recommendation_type VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    priority_reasons TEXT,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    confidence_basis TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PROPOSED',
    implementation_guidance TEXT,
    compensating_controls TEXT,
    implementation_risks TEXT,
    created_by VARCHAR(128) NOT NULL DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE defense_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES defense_recommendations(id) ON DELETE CASCADE,
    evidence_type VARCHAR(64) NOT NULL,
    source_type VARCHAR(64) NOT NULL,
    source_id VARCHAR(255),
    description TEXT NOT NULL,
    confidence DOUBLE PRECISION DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE finding_defense_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL,
    control_id UUID NOT NULL REFERENCES defense_controls(id) ON DELETE CASCADE,
    relationship VARCHAR(32) NOT NULL DEFAULT 'PRIMARY',
    confidence DOUBLE PRECISION DEFAULT 0.9,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_finding_control UNIQUE(finding_id, control_id)
);

CREATE TABLE remediation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    finding_id UUID,
    recommendation_id UUID REFERENCES defense_recommendations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    owner VARCHAR(128) NOT NULL DEFAULT 'Unassigned',
    target_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE remediation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES remediation_plans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(64) NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    owner VARCHAR(128) NOT NULL DEFAULT 'Unassigned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE defense_validation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES defense_recommendations(id) ON DELETE CASCADE,
    plan_title VARCHAR(255) NOT NULL,
    validation_steps_json TEXT NOT NULL,
    verification_boundary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_def_rec_finding ON defense_recommendations(finding_id);
CREATE INDEX idx_def_rec_status ON defense_recommendations(status);
CREATE INDEX idx_def_rec_priority ON defense_recommendations(priority);
CREATE INDEX idx_def_ev_rec ON defense_evidence(recommendation_id);
CREATE INDEX idx_find_ctrl_finding ON finding_defense_controls(finding_id);
CREATE INDEX idx_rem_plan_finding ON remediation_plans(finding_id);
CREATE INDEX idx_rem_task_plan ON remediation_tasks(plan_id);
CREATE INDEX idx_val_plan_rec ON defense_validation_plans(recommendation_id);

-- Seed Baseline Security Controls Library
INSERT INTO defense_controls (control_code, name, category, description, implementation_guidance, validation_guidance) VALUES
('DB-QUERY-001', 'Parameterized Database Queries', 'DATABASE', 'Construct all SQL queries using parameterized statements or object-relational mappers to eliminate dynamic string concatenation.', 'Replace string formatting in database queries with prepared statement placeholders (e.g. PreparedStatement or JPA named parameters).', 'Re-test input parameters with SQL injection payloads and verify application returns handled responses without SQL execution errors.'),
('APP-VAL-001', 'Server-Side Input Validation', 'APPLICATION', 'Validate all client-supplied inputs on the server using strict allow-lists for data type, length, structure, and character sets.', 'Implement centralized DTO validation annotations (@NotNull, @Size, @Pattern) or framework input sanitizers.', 'Submit out-of-bounds and illegal characters to API endpoints and verify HTTP 400 Bad Request responses.'),
('APP-ENC-001', 'Context-Aware Output Encoding', 'APPLICATION', 'Encode dynamic data before rendering into HTML, JavaScript, dynamic attributes, or CSS contexts to neutralize script injection.', 'Use auto-encoding web frameworks (e.g. React JSX, Angular interpolation) or HTML entity escaping utilities.', 'Inject HTML script tags (<script>alert(1)</script>) and verify they render as escaped literal text.'),
('HTTP-SEC-001', 'Strict-Transport-Security (HSTS)', 'HTTP', 'Enforce HTTPS transport security using Strict-Transport-Security response headers to protect connection integrity.', 'Configure web server or gateway to emit Strict-Transport-Security: max-age=31536000; includeSubDomains header on HTTPS responses.', 'Inspect HTTP response headers for Strict-Transport-Security and verify max-age is set to at least 1 year (31536000s).'),
('HTTP-SEC-002', 'Comprehensive Security Headers', 'HTTP', 'Emit defense-in-depth HTTP headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Content-Security-Policy).', 'Add HTTP header middleware setting X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Content-Security-Policy.', 'Verify all HTTP responses contain expected security headers across API endpoints.'),
('COOKIE-SEC-001', 'Secure Cookie Configuration', 'SESSION', 'Set Secure, HttpOnly, and SameSite attributes on all session and authentication cookies.', 'Configure application container session cookie flags: SameSite=Lax/Strict, HttpOnly=true, Secure=true.', 'Inspect Set-Cookie headers on authentication responses for Secure, HttpOnly, and SameSite attributes.'),
('CORS-001', 'Restrictive Cross-Origin Resource Sharing', 'API', 'Configure explicit CORS access controls and forbid wildcard (*) Access-Control-Allow-Origin with credentials.', 'Define allowed CORS origins explicitly in web security configuration and reject unauthorized Origin request headers.', 'Send OPTIONS preflight requests with unauthorized Origin headers and verify access is denied.'),
('RATE-001', 'API Rate Limiting & Throttling', 'API', 'Implement request rate limits on sensitive endpoints to prevent brute-force attacks and resource exhaustion.', 'Deploy rate limiting filters (e.g. Bucket4j or API gateway rate limit policies) by client IP or account ID.', 'Send rapid burst HTTP requests to login or query endpoints and confirm HTTP 429 Too Many Requests response.');
