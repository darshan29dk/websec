import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { findingApi } from '../services/api/findingApi';
import { retestApi } from '../services/api/retestApi';
import { FindingDetail, FindingSeverity, FindingStatus } from '../types/finding';
import { ArrowLeft, Shield, AlertTriangle, FileText, ExternalLink, Link2, MessageSquare, CheckCircle, Clock } from 'lucide-react';

export const FindingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<FindingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [newStatus, setNewStatus] = useState<FindingStatus | ''>('');
  const [statusComment, setStatusComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      loadFindingDetail();
    }
  }, [id]);

  const loadFindingDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await findingApi.getFindingById(id);
      if (res) {
        setDetail(res);
        setNewStatus(res.finding.status);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vulnerability finding details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newStatus || newStatus === detail?.finding.status) return;

    setIsUpdatingStatus(true);
    try {
      const res = await findingApi.updateStatus(id, newStatus, statusComment);
      if (res) {
        setStatusComment('');
        await loadFindingDetail();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update finding status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await findingApi.addComment(id, commentText.trim());
      if (res) {
        setCommentText('');
        await loadFindingDetail();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getSeverityBadgeColor = (sev: FindingSeverity) => {
    switch (sev) {
      case 'CRITICAL': return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
      case 'HIGH': return { bg: '#fff7ed', color: '#ea580c', border: '#fdba74' };
      case 'MEDIUM': return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'LOW': return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      default: return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading vulnerability finding intelligence...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/findings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} /> Back to Findings
        </button>
        <div style={{ padding: '16px', backgroundColor: '#3b0000', border: '1px solid #800000', borderRadius: '8px', color: '#ff4d4d' }}>
          {error || 'Finding not found.'}
        </div>
      </div>
    );
  }

  const { finding, evidence, references, correlations, comments } = detail;
  const badge = getSeverityBadgeColor(finding.severity);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '13px',
        }}
      >
        <ArrowLeft size={14} /> Back to Findings
      </button>

      {/* Header card */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`
              }}>
                {finding.severity}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                Type: {finding.findingType}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                Confidence: {finding.confidence}
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
              {finding.title}
            </h1>
          </div>

          {/* Status workflow form */}
          <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as FindingStatus)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-heading)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <option value="OPEN">OPEN</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                <option value="ACCEPTED_RISK">ACCEPTED_RISK</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REOPENED">REOPENED</option>
              </select>
              {newStatus !== finding.status && (
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--accent-primary)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Save Status'}
                </button>
              )}
            </div>
            {newStatus !== finding.status && (
              <input
                type="text"
                placeholder="Audit comment for status change..."
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-heading)',
                  fontSize: '12px',
                  width: '240px',
                }}
              />
            )}
          </form>
        </div>

        {finding.description && (
          <p style={{ fontSize: '14px', color: 'var(--text-heading)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
            {finding.description}
          </p>
        )}

        {/* Provenance Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: 'var(--bg-dark)', padding: '12px', borderRadius: '6px', fontSize: '12px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Source Tools: </span>
            <strong style={{ fontFamily: 'monospace', color: 'var(--text-heading)' }}>{finding.source}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Asset Value: </span>
            <strong style={{ color: 'var(--text-heading)' }}>{finding.assetValue || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Endpoint URL: </span>
            <strong style={{ color: 'var(--text-heading)' }}>{finding.endpointUrl || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Deduplication Hash: </span>
            <strong style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{finding.deduplicationHash.substring(0, 16)}...</strong>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left column: Evidence & Correlations & Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Finding Evidence (Redacted) */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: 'var(--accent-primary)' }} /> Finding Evidence Provenance ({evidence.length})
            </h3>
            {evidence.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No normalized evidence records available for this finding.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {evidence.map((ev) => (
                  <div key={ev.id} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{ev.evidenceType}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>Source: {ev.source}</span>
                    </div>
                    {ev.location && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Location: <code style={{ color: 'var(--text-heading)' }}>{ev.location}</code>
                      </div>
                    )}
                    {(ev.redactedContent || ev.content) && (
                      <pre style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        padding: '10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#0f172a',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        margin: 0,
                      }}>
                        {ev.redactedContent || ev.content}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Correlations */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link2 size={16} style={{ color: 'var(--accent-primary)' }} /> Tool Correlation & Multi-Tool Evidence ({correlations.length})
            </h3>
            {correlations.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No correlated findings detected across multiple tools for this observation.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {correlations.map((c) => (
                  <div key={c.id} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-heading)' }}>{c.relatedFindingTitle}</span>
                      <span style={{ color: 'var(--accent-primary)', fontSize: '11px' }}>{c.correlationType} ({c.confidence})</span>
                    </div>
                    {c.reason && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {c.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remediation & Controlled Retest Validation Panel */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} style={{ color: '#00cc88' }} /> Controlled Retesting & Defense Validation
              </h3>
              <button
                onClick={async () => {
                  try {
                    await retestApi.createRetest(finding.id);
                    navigate('/retests');
                  } catch (err: any) {
                    alert(err.message || 'Failed to queue controlled retest.');
                  }
                }}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#00cc88',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Queue Controlled Retest
              </button>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--bg-dark)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-heading)', marginBottom: '12px' }}>
              Current Status: <strong style={{ color: '#00cc88' }}>{finding.status}</strong>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              AEGIS validates fixes using evidence comparison (before/after observation). Findings are marked FIXED only when retest evidence satisfies criteria.
            </p>
          </div>

          {/* Analyst Comments */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} style={{ color: 'var(--accent-primary)' }} /> Analyst Audit Comments ({comments.length})
            </h3>
            
            <form onSubmit={handleAddComment} style={{ marginBottom: '16px' }}>
              <textarea
                placeholder="Add an analyst comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-heading)',
                  fontSize: '13px',
                  marginBottom: '8px',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: 'var(--accent-primary)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmittingComment ? 'Submitting...' : 'Post Comment'}
                </button>
              </div>
            </form>

            {comments.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No analyst comments recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {comments.map((cm) => (
                  <div key={cm.id} style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{cm.authorEmail || 'Analyst'}</span>
                      <span>{new Date(cm.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-heading)' }}>
                      {cm.comment}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column: References & Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Vulnerability Intelligence & Catalog References */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} style={{ color: 'var(--accent-primary)' }} /> Vulnerability Intelligence References
            </h3>
            {references.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-dark)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                CVSS/CVE intelligence unavailable
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {references.map((r) => (
                  <div key={r.id} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{r.referenceType}: {r.referenceId}</span>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          Link <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {r.title && <div style={{ color: 'var(--text-heading)', marginTop: '4px' }}>{r.title}</div>}
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>Source: {r.source}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finding Timeline Metadata */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: 'var(--accent-primary)' }} /> Provenance & Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>FIRST SEEN</div>
                <div style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{new Date(finding.firstSeenAt).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>LAST SEEN</div>
                <div style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{new Date(finding.lastSeenAt).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ASSESSMENT ID</div>
                <div style={{ color: 'var(--text-heading)', fontFamily: 'monospace', fontSize: '12px' }}>{finding.assessmentId}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
