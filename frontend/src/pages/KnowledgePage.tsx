import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  ExternalLink,
  Layers,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { knowledgeApi } from '../services/api/knowledgeApi';
import { KnowledgeDocument, KnowledgeSearchResult, KnowledgeIngestRequest } from '../types/knowledge';

export const KnowledgePage: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ingestion Modal State
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('OWASP');
  const [sourceUrl, setSourceUrl] = useState('');
  const [documentType, setDocumentType] = useState('SECURITY_STANDARD');
  const [version, setVersion] = useState('1.0');
  const [content, setContent] = useState('');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await knowledgeApi.getAllDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch knowledge base documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await knowledgeApi.searchKnowledge(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      alert('Search failed: ' + (err?.message || 'Error executing knowledge search'));
    } finally {
      setSearching(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setIngesting(true);
      const req: KnowledgeIngestRequest = {
        title,
        source,
        sourceUrl,
        documentType,
        version,
        content,
      };
      await knowledgeApi.ingestDocument(req);
      setShowIngestModal(false);
      setTitle('');
      setContent('');
      fetchDocuments();
    } catch (err: any) {
      alert('Failed to ingest knowledge document: ' + (err?.message || 'Check database permissions.'));
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={22} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Security Knowledge Base
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#e0f2fe',
                  color: 'var(--brand-primary)',
                  border: '1px solid #bae6fd',
                }}
              >
                RAG Vector Store
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Authoritative OWASP, CWE, CVSS, and Hardening Standards used for evidence-grounded AI synthesis.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowIngestModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--brand-primary)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Plus size={14} /> Add Document
          </button>
        </div>
      </div>

      {/* RAG Semantic Search Bar */}
      <div
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px 20px',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge documents (e.g. SQL Injection, HSTS, XSS, TLS, CSRF)..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'var(--brand-primary)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: searching ? 'not-allowed' : 'pointer',
            }}
          >
            {searching ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} Search
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} style={{ color: 'var(--brand-primary)' }} />
            Semantic Search Results ({searchResults.length})
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {searchResults.map((res, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)' }}>{res.source}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    {Math.round(res.relevanceScore * 100)}% match
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{res.title}</h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    background: '#f8fafc',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                  }}
                >
                  "{res.contentExcerpt}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Documents List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} style={{ color: 'var(--brand-primary)' }} />
            Ingested Authoritative Documents ({documents.length})
          </div>
        </div>

        {loading ? (
          <div
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
            <div>Loading security knowledge documents...</div>
          </div>
        ) : error ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: '#dc2626',
            }}
          >
            <AlertTriangle size={24} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 600 }}>Error loading knowledge documents</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>{error}</div>
          </div>
        ) : documents.length === 0 ? (
          <div
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <BookOpen size={36} style={{ color: 'var(--brand-primary)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              No Security Knowledge Documents Available
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 18px auto' }}>
              The knowledge base feeds authoritative standards into the RAG pipeline. Click "Add Document" to ingest OWASP, CWE, or custom security baseline guidance.
            </p>
            <button
              onClick={() => setShowIngestModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Document
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {documents.map((doc, idx) => (
              <div
                key={doc.id || idx}
                style={{
                  background: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                      {doc.source}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {doc.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      background: '#f8fafc',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      maxHeight: '90px',
                      overflowY: 'auto',
                    }}
                  >
                    {doc.content}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '8px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>Chunks: {doc.chunkCount ?? 1}</span>
                  {doc.sourceUrl && (
                    <a
                      href={doc.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--brand-primary)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Source <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ingestion Modal */}
      {showIngestModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Ingest Security Knowledge
                </h3>
              </div>
              <button
                onClick={() => setShowIngestModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleIngest} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. OWASP Top 10 A03:2021 - Injection"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Source *</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: '#ffffff',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="OWASP">OWASP Foundation</option>
                    <option value="CWE / MITRE">CWE / MITRE</option>
                    <option value="CVE / NVD">CVE / NVD</option>
                    <option value="CISA">CISA Guidance</option>
                    <option value="Hardening Standard">Hardening Standard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Document Type *</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: '#ffffff',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="SECURITY_STANDARD">Security Standard</option>
                    <option value="VULNERABILITY_GUIDANCE">Vulnerability Guidance</option>
                    <option value="HARDENING_GUIDANCE">Hardening Guidance</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Source URL</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://owasp.org/..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Content Guidance Text *</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the authoritative security standard guidance text here..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    background: '#f1f5f9',
                    color: 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingesting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 18px',
                    borderRadius: '6px',
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: ingesting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {ingesting ? <RefreshCw size={13} className="spin" /> : <Plus size={13} />}
                  Ingest Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
