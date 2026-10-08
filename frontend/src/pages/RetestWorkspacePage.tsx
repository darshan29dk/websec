import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { retestApi } from '../services/api/retestApi';
import {
  Retest,
  RetestCheck,
  RetestEvidence,
  DefenseValidation,
  RetestDashboardMetrics,
} from '../types/retest';
import {
  RotateCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSearch,
  Lock,
  Play,
  Layers,
  ArrowRight,
  ExternalLink,
  Target,
} from 'lucide-react';

export const RetestWorkspacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetIdParam = searchParams.get('targetId') || '';

  const [metrics, setMetrics] = useState<RetestDashboardMetrics | null>(null);
  const [retests, setRetests] = useState<Retest[]>([]);
  const [selectedRetest, setSelectedRetest] = useState<Retest | null>(null);
  const [checks, setChecks] = useState<RetestCheck[]>([]);
  const [evidence, setEvidence] = useState<RetestEvidence[]>([]);
  const [validation, setValidation] = useState<DefenseValidation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, allRetests] = await Promise.all([
        retestApi.getDashboardMetrics().catch(() => null),
        retestApi.listAllRetests(targetIdParam || undefined).catch(() => []),
      ]);
      setMetrics(m);
      setRetests(allRetests);
      if (allRetests.length > 0) {
        // If currently selected retest is still in the list, keep it; otherwise select first
        if (!selectedRetest || !allRetests.some((r) => r.id === selectedRetest.id)) {
          setSelectedRetest(allRetests[0]);
        }
      } else {
        setSelectedRetest(null);
      }
    } catch (err: any) {
      console.error('Failed to load retest workspace data:', err);
      setError(err?.message || 'Unable to load retest data.');
    } finally {
      setLoading(false);
    }
  };

  const loadRetestDetails = async (retest: Retest) => {
    setSelectedRetest(retest);
    try {
      const [c, ev, val] = await Promise.all([
        retestApi.getRetestChecks(retest.id).catch(() => []),
        retestApi.getRetestEvidence(retest.id).catch(() => []),
        retestApi.getRetestValidation(retest.id).catch(() => null),
      ]);
      setChecks(c);
      setEvidence(ev);
      setValidation(val);
    } catch (err) {
      console.error('Failed to load retest details:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetIdParam]);

  useEffect(() => {
    if (selectedRetest) {
      loadRetestDetails(selectedRetest);
    }
  }, [selectedRetest?.id]);

  const handleStartRetest = async (id: string) => {
    setActionLoading(true);
    try {
      const updated = await retestApi.startRetest(id);
      setSelectedRetest(updated);
      setRetests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      await loadRetestDetails(updated);
    } catch (err: any) {
      console.error('Failed to start retest:', err);
      alert('Failed to start retest: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const getValidationBadge = (status?: string) => {
    const s = status?.toUpperCase() || 'UNKNOWN';
    switch (s) {
      case 'FIXED':
        return {
          bg: '#ecfdf5',
          text: '#059669',
          border: '#a7f3d0',
          label: 'FIXED',
          icon: <CheckCircle2 size={13} style={{ color: '#059669' }} />,
        };
      case 'PARTIALLY_FIXED':
        return {
          bg: '#fefce8',
          text: '#d97706',
          border: '#fde047',
          label: 'PARTIALLY FIXED',
          icon: <AlertTriangle size={13} style={{ color: '#d97706' }} />,
        };
      case 'NOT_FIXED':
      case 'STILL_PRESENT':
        return {
          bg: '#fef2f2',
          text: '#dc2626',
          border: '#fca5a5',
          label: 'NOT FIXED',
          icon: <XCircle size={13} style={{ color: '#dc2626' }} />,
        };
      case 'REGRESSED':
        return {
          bg: '#fff1f2',
          text: '#e11d48',
          border: '#fecdd3',
          label: 'REGRESSED',
          icon: <AlertTriangle size={13} style={{ color: '#e11d48' }} />,
        };
      case 'RUNNING':
        return {
          bg: '#eff6ff',
          text: '#0284c7',
          border: '#bae6fd',
          label: 'RUNNING',
          icon: <RotateCw size={13} className="spin" style={{ color: '#0284c7' }} />,
        };
      case 'QUEUED':
        return {
          bg: '#f8fafc',
          text: '#64748b',
          border: '#cbd5e1',
          label: 'QUEUED',
          icon: <RotateCw size={13} style={{ color: '#64748b' }} />,
        };
      default:
        return {
          bg: '#f8fafc',
          text: '#64748b',
          border: '#e2e8f0',
          label: s,
          icon: null,
        };
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSearch size={20} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Controlled Retesting & Defense Validation
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Evidence-grounded vulnerability re-testing, before/after evidence comparison, and regression verification.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#f0f7ff',
              border: '1px solid var(--border-subtle)',
              color: 'var(--brand-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Target Filter Notice if filtered */}
      {targetIdParam && (
        <div
          style={{
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#0369a1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} />
            <span>
              Filtering retests for Target: <strong>{targetIdParam}</strong>
            </span>
          </div>
          <button
            onClick={() => setSearchParams({})}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '12px',
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Safety Policy Notice */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <Lock size={16} style={{ color: 'var(--brand-primary)', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Controlled Verification Policy:</strong> Retests execute
          strictly against registered authorized targets with approved testing scope. Raw shell injections or arbitrary
          commands are strictly forbidden. Results require verifiable cryptographic or HTTP evidence before status transition.
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        {[
          { label: 'Total Retests', val: metrics?.totalRetests ?? retests.length, color: 'var(--text-primary)' },
          { label: 'Awaiting Run', val: metrics?.awaitingRetest ?? retests.filter((r) => r.status === 'QUEUED').length, color: '#d97706' },
          { label: 'In Progress', val: metrics?.currentlyRetesting ?? retests.filter((r) => r.status === 'RUNNING').length, color: '#0284c7' },
          { label: 'Fixed', val: metrics?.fixedCount ?? retests.filter((r) => r.status === 'COMPLETED' && r.validation?.validationStatus === 'FIXED').length, color: '#059669' },
          { label: 'Partial Fix', val: metrics?.partiallyFixedCount ?? 0, color: '#d97706' },
          { label: 'Not Fixed', val: metrics?.notFixedCount ?? 0, color: '#dc2626' },
          { label: 'Regressed', val: metrics?.regressedCount ?? 0, color: '#e11d48' },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: item.color, marginTop: '4px' }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
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
          <RotateCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
          <div>Loading retest history and validation logs...</div>
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
          <div style={{ fontWeight: 600 }}>Error loading retest data</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>{error}</div>
          <button
            onClick={loadData}
            style={{
              marginTop: '12px',
              padding: '6px 14px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      ) : retests.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <ShieldCheck size={36} style={{ color: 'var(--brand-primary)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            No Controlled Retests Found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 18px auto' }}>
            Retests are triggered once a finding's remediation is ready for verification. Navigate to any Security Finding or Remediation item to initiate a controlled retest.
          </p>
          <Link
            to="/findings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            Browse Findings <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Retests List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Validation Records ({retests.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '720px', overflowY: 'auto' }}>
              {retests.map((retest) => {
                const isSelected = selectedRetest?.id === retest.id;
                const statusBadge = getValidationBadge(retest.validation?.validationStatus || retest.status);

                return (
                  <div
                    key={retest.id}
                    onClick={() => loadRetestDetails(retest)}
                    style={{
                      background: 'var(--surface-primary)',
                      border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none',
                      transition: 'border 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '220px',
                        }}
                      >
                        {retest.findingTitle || 'Security Weakness Retest'}
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: statusBadge.bg,
                          color: statusBadge.text,
                          border: `1px solid ${statusBadge.border}`,
                          flexShrink: 0,
                        }}
                      >
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Target: <span style={{ fontFamily: 'monospace' }}>{retest.targetName || retest.targetUrl}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>By: <strong style={{ color: 'var(--text-secondary)' }}>{retest.requestedBy}</strong></span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {new Date(retest.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Retest Inspector */}
          {selectedRetest && (
            <div
              style={{
                background: 'var(--surface-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Detail Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '16px',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      RETEST #{selectedRetest.uuid ? selectedRetest.uuid.substring(0, 8) : selectedRetest.id.substring(0, 8)}
                    </span>
                    {(() => {
                      const badge = getValidationBadge(validation?.validationStatus || selectedRetest.status);
                      return (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>

                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '10px 0 4px 0' }}>
                    {selectedRetest.findingTitle || 'Security Finding Retest'}
                  </h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    <span>
                      Target: <strong style={{ fontFamily: 'monospace', color: 'var(--brand-primary)' }}>{selectedRetest.targetUrl}</strong>
                    </span>
                    {selectedRetest.findingId && (
                      <Link
                        to={`/findings?findingId=${selectedRetest.findingId}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--brand-primary)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        View Finding <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                {selectedRetest.status === 'QUEUED' && (
                  <button
                    onClick={() => handleStartRetest(selectedRetest.id)}
                    disabled={actionLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: '#059669',
                      color: '#ffffff',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Play size={14} /> {actionLoading ? 'Starting...' : 'Execute Retest'}
                  </button>
                )}
              </div>

              {/* Validation Result Decision Banner */}
              {validation ? (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} style={{ color: '#059669' }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        Validation Decision: {validation.validationStatus}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                      }}
                    >
                      Confidence: {validation.confidence}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      background: '#ffffff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontFamily: 'monospace',
                    }}
                  >
                    {validation.summary || 'Validation checks completed. Status updated based on observed evidence.'}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  Retest awaiting execution or currently in progress. Detailed validation decision will generate upon completion of active checks.
                </div>
              )}

              {/* Before vs After Evidence Comparison */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Evidence Verification (Before vs After)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* BEFORE: Baseline Evidence */}
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#b45309' }}>
                      <AlertTriangle size={14} /> BEFORE (Original Finding Baseline)
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #fef3c7',
                        maxHeight: '140px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {evidence.find((e) => e.source === 'ASSESSMENT_BASELINE')?.evidenceData ||
                        'Original baseline vulnerability evidence captured during the initial assessment.'}
                    </div>
                  </div>

                  {/* AFTER: Retest Evidence */}
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                      <CheckCircle2 size={14} /> AFTER (Retest Observation)
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #d1fae5',
                        maxHeight: '140px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {evidence.find((e) => e.source !== 'ASSESSMENT_BASELINE')?.evidenceData ||
                        'New retest observation data. Indicates verified condition post-remediation.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Retest Checks Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Executed Retest Checks ({checks.length})
                </div>

                {checks.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No granular check records available for this retest run.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {checks.map((check) => (
                      <div
                        key={check.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--brand-primary)' }}>
                            {check.checkType}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: check.status === 'PASSED' ? '#ecfdf5' : '#fef2f2',
                              color: check.status === 'PASSED' ? '#059669' : '#dc2626',
                              border: `1px solid ${check.status === 'PASSED' ? '#a7f3d0' : '#fca5a5'}`,
                            }}
                          >
                            {check.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Tool Adapter: <strong style={{ color: 'var(--text-primary)' }}>{check.toolName}</strong>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            background: '#ffffff',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            fontFamily: 'monospace',
                          }}
                        >
                          Expected: {check.expectedCondition}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
