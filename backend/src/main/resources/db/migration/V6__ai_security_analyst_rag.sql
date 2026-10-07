-- AEGIS Phase 6 Migration: AI Security Analyst + RAG

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(100) NOT NULL,
    source_url VARCHAR(1024),
    document_type VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    published_at TIMESTAMP WITH TIME ZONE,
    retrieved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    document_id BIGINT NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    embedding TEXT,
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_investigations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    assessment_id UUID REFERENCES security_assessments(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
    requested_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(50) DEFAULT '1.0',
    confidence DOUBLE PRECISION,
    confidence_basis TEXT,
    verdict VARCHAR(100),
    summary TEXT,
    what_happened TEXT,
    timeline_summary TEXT,
    affected_target_summary TEXT,
    affected_endpoints_summary TEXT,
    root_cause TEXT,
    impact TEXT,
    supporting_evidence_summary TEXT,
    contradicting_evidence_summary TEXT,
    missing_evidence_summary TEXT,
    recommended_next_steps TEXT,
    limitations TEXT,
    raw_response TEXT,
    failure_reason TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_analysis_claims (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    investigation_id BIGINT NOT NULL REFERENCES ai_investigations(id) ON DELETE CASCADE,
    claim_type VARCHAR(50) NOT NULL,
    claim_text TEXT NOT NULL,
    confidence DOUBLE PRECISION,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'SUPPORTED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_evidence_references (
    id BIGSERIAL PRIMARY KEY,
    investigation_id BIGINT NOT NULL REFERENCES ai_investigations(id) ON DELETE CASCADE,
    claim_id BIGINT REFERENCES ai_analysis_claims(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    evidence_id VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_knowledge_references (
    id BIGSERIAL PRIMARY KEY,
    investigation_id BIGINT NOT NULL REFERENCES ai_investigations(id) ON DELETE CASCADE,
    document_id BIGINT REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_id BIGINT REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
    relevance_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    citation_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kd_status ON knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_kd_source ON knowledge_documents(source);
CREATE INDEX IF NOT EXISTS idx_kc_doc ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_inv_status ON ai_investigations(status);
CREATE INDEX IF NOT EXISTS idx_ai_inv_assessment ON ai_investigations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_ai_inv_incident ON ai_investigations(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_claims_inv ON ai_analysis_claims(investigation_id);
CREATE INDEX IF NOT EXISTS idx_ai_ev_ref_inv ON ai_evidence_references(investigation_id);
CREATE INDEX IF NOT EXISTS idx_ai_kn_ref_inv ON ai_knowledge_references(investigation_id);
