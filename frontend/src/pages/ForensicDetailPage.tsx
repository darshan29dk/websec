import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { forensicApi } from '../services/api/forensicApi';
import {
  ForensicCase,
  ForensicEvidence,
  TimelineEvent,
  HttpForensicEvent,
  NetworkForensicEvent,
  AttackEvent,
  ForensicSummary,
  EvidenceVerification,
} from '../types/forensic';
import {
  FolderGit2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Hash,
  FileCode,
  Network,
  Activity,
  Lock,
  AlertTriangle,
  FileText,
  ArrowLeft,
  RefreshCw,
  Plus,
  Target as TargetIcon,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

export const ForensicDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [forensicCase, setForensicCase] = useState<ForensicCase | null>(null);
  const [summary, setSummary] = useState<ForensicSummary | null>(null);
  const [evidenceList, setEvidenceList] = useState<ForensicEvidence[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [httpEvents, setHttpEvents] = useState<HttpForensicEvent[]>([]);
  const [networkEvents, setNetworkEvents] = useState<NetworkForensicEvent[]>([]);
  const [attackEvents, setAttackEvents] = useState<AttackEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'timeline' | 'http' | 'network' | 'reconstruction'>('overview');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<EvidenceVerification | null>(null);

  useEffect(() => {
    if (id) {
      loadAllCaseData(id);
    }
  }, [id]);

  const loadAllCaseData = async (caseId: string) => {
    setLoading(true);
    try {
      const [caseRes, summaryRes, evRes, timelineRes, httpRes, netRes, attackRes] = await Promise.allSettled([
        forensicApi.getCaseById(caseId),
        forensicApi.getSummary(caseId),
        forensicApi.getEvidence(caseId, { size: 50 }),
        forensicApi.getTimeline(caseId, { size: 100 }),
        forensicApi.getHttpEvents(caseId, { size: 50 }),
        forensicApi.getNetworkEvents(caseId, { size: 50 }),
        forensicApi.getAttackEvents(caseId),
      ]);

      if (caseRes.status === 'fulfilled' && caseRes.value) setForensicCase(caseRes.value);
      if (summaryRes.status === 'fulfilled' && summaryRes.value) setSummary(summaryRes.value);
      if (evRes.status === 'fulfilled' && evRes.value?.content) setEvidenceList(evRes.value.content);
      if (timelineRes.status === 'fulfilled' && timelineRes.value?.content) setTimelineEvents(timelineRes.value.content);
      if (httpRes.status === 'fulfilled' && httpRes.value?.content) setHttpEvents(httpRes.value.content);
      if (netRes.status === 'fulfilled' && netRes.value?.content) setNetworkEvents(netRes.value.content);
      if (attackRes.status === 'fulfilled' && attackRes.value) setAttackEvents(attackRes.value);
    } catch (err) {
      console.error('Failed to load forensic case detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async (evidenceId: string) => {
    setVerifyingId(evidenceId);
    try {
      const res = await forensicApi.verifyEvidence(evidenceId);
      if (res) {
        setVerificationResult(res);
        if (id) loadAllCaseData(id);
      }
    } catch (err) {
      console.error('Failed to verify evidence integrity:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading || !forensicCase) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading forensic investigation workspace...</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Backtrack Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/forensics');
            }
          }}
          title="Backtrack: Go back to last step"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '5px 12px',
            color: 'var(--text-heading)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(2, 132, 199, 0.05)',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-light)';
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-heading)';
          }}
        >
          <ArrowLeft size={14} color="var(--accent-primary)" />
          <span>Backtrack to Last Step</span>
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/</span>
        <button
          onClick={() => navigate('/forensics')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Forensic Cases
        </button>
      </div>

      {/* Case Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)' }}>
              Case #{forensicCase.caseNumber || forensicCase.id.substring(0, 8)}: {forensicCase.title}
            </h1>
            <StatusBadge status={forensicCase.status} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Target: {forensicCase.targetName} • Forensic investigation & chain of custody analysis
          </p>
        </div>

        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={() => id && loadAllCaseData(id)}>
          Refresh Case
        </Button>
      </div>

      {/* RELATIONSHIPS BAR (Requirement 8) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '12px',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px' }}>
          Correlated Resources:
        </span>
        {forensicCase.targetId && (
          <Link
            to={`/targets/${forensicCase.targetId}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            <TargetIcon size={12} color="var(--accent-primary)" /> Target: {forensicCase.targetName || 'Scope'}
          </Link>
        )}
        {forensicCase.incidentId && (
          <Link
            to={`/incidents/${forensicCase.incidentId}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 600,
              color: '#dc2626',
            }}
          >
            <AlertTriangle size={12} color="#dc2626" /> Incident #{forensicCase.incidentId.substring(0, 8)}
          </Link>
        )}
        <Link
          to={`/investigations`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: 600,
          }}
        >
          <FileText size={12} color="var(--accent-primary)" /> Investigation Workspace
        </Link>
        <Link
          to={`/findings`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            color: '#ea580c',
          }}
        >
          <Lock size={12} color="#ea580c" /> Related Findings
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {[
          { key: 'overview', label: 'Case Summary' },
          { key: 'evidence', label: `Evidence Items (${evidenceList.length})` },
          { key: 'timeline', label: `Chronological Timeline (${timelineEvents.length})` },
          { key: 'http', label: `HTTP Telemetry (${httpEvents.length})` },
          { key: 'network', label: `Network Signals (${networkEvents.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <Card title="Case Summary Attributes">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Case ID</span>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '2px' }}>
                  {forensicCase.id}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Target Scope</span>
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                  {forensicCase.targetName || 'Scope'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Case Status</span>
                <div style={{ marginTop: '2px' }}>
                  <StatusBadge status={forensicCase.status} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Priority Level</span>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', color: forensicCase.priority === 'CRITICAL' ? '#dc2626' : '#ea580c' }}>
                  {forensicCase.priority}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Opened Timestamp</span>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                  {new Date(forensicCase.openedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Analyst</span>
                <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>
                  {forensicCase.createdByEmail || 'Unassigned'}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Chain of Custody &amp; Integrity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Evidence Count:</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{forensicCase.evidenceCount} Items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unverified Items:</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: forensicCase.unverifiedEvidenceCount > 0 ? '#ea580c' : '#15803d' }}>
                  {forensicCase.unverifiedEvidenceCount} Unverified
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hash Standard:</span>
                <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>SHA-256</span>
              </div>
              <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)' }}>
                Evidence cannot be altered once sealed into the case record. Hashes are cross-checked against raw payloads.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: EVIDENCE */}
      {activeTab === 'evidence' && (
        <Card title="Digital Evidence Ledger" subtitle="SHA-256 hash verified artifacts, logs, and payloads">
          {evidenceList.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No evidence artifacts collected for this case yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {evidenceList.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                          {ev.evidenceType}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: ev.integrityStatus === 'VERIFIED' ? '#ecfdf5' : '#fffbeb',
                            color: ev.integrityStatus === 'VERIFIED' ? '#047857' : '#b45309',
                          }}
                        >
                          {ev.integrityStatus === 'VERIFIED' ? 'HASH VERIFIED' : 'PENDING VERIFICATION'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Source: <strong>{ev.sourceType}</strong> • Collected: {new Date(ev.collectionTime).toLocaleString()}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={verifyingId === ev.id}
                      onClick={() => handleVerifyIntegrity(ev.id)}
                    >
                      {verifyingId === ev.id ? 'Checking...' : 'Verify SHA-256'}
                    </Button>
                  </div>

                  {/* SHA-256 Hash */}
                  <div style={{ marginTop: '10px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SHA-256 Hash: </span>
                    <code style={{ fontSize: '11px', color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px' }}>
                      {ev.contentHash || 'Hash pending'}
                    </code>
                  </div>

                  {/* Payload / Description */}
                  {ev.description && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {ev.description}
                    </div>
                  )}

                  {ev.provenance && (
                    <pre
                      style={{
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        marginTop: '8px',
                        maxHeight: '160px',
                        overflowX: 'auto',
                      }}
                    >
                      {ev.provenance}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB: TIMELINE */}
      {activeTab === 'timeline' && (
        <Card title="Chronological Event Timeline" subtitle="Correlated digital forensic sequence of events">
          {timelineEvents.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No timeline events recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timelineEvents.map((t, idx) => (
                <div
                  key={t.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                  }}
                >
                  <Clock size={16} color="var(--accent-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {t.title || t.eventType}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {t.eventTime ? new Date(t.eventTime).toLocaleString() : (t.timeDescription || 'N/A')}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '2px' }}>
                      {t.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB: HTTP TELEMETRY */}
      {activeTab === 'http' && (
        <Card title="HTTP Forensic Events" subtitle="Captured HTTP request/response exchanges">
          {httpEvents.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No HTTP forensic events recorded for this case.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {httpEvents.map((h, idx) => (
                <div
                  key={h.id || idx}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '12px' }}>
                      {h.method} {h.host ? `${h.scheme || 'http'}://${h.host}${h.path}` : h.path}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: (h.statusCode && h.statusCode >= 400) ? '#dc2626' : '#15803d' }}>
                      Status: {h.statusCode !== undefined ? h.statusCode : 'N/A'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Timestamp: {h.eventTime ? new Date(h.eventTime).toLocaleString() : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB: NETWORK SIGNALS */}
      {activeTab === 'network' && (
        <Card title="Network Forensic Signals" subtitle="Layer 3/4 network connections, ports, and protocols">
          {networkEvents.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No network forensic signals captured for this case.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {networkEvents.map((n, idx) => (
                <div
                  key={n.id || idx}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      {n.protocol} {n.sourceIp}:{n.sourcePort} → {n.destinationIp}:{n.destinationPort}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {n.eventTime ? new Date(n.eventTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
