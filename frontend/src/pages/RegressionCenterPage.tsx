import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Target as TargetIcon,
  RefreshCw,
  FileText,
  XCircle,
} from 'lucide-react';
import { postureApi } from '../services/api/postureApi';
import { targetApi } from '../services/api/targetApi';
import { SecurityTarget } from '../types/target';
import {
  SecurityRegressionDto,
  RegressionSummaryDto,
  RegressionStatus,
  RegressionType,
  RegressionConfidence,
} from '../types/posture';

export const RegressionCenterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetIdFromUrl = searchParams.get('targetId') || '';

  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetIdFromUrl);
  const [summary, setSummary] = useState<RegressionSummaryDto | null>(null);
  const [regressions, setRegressions] = useState<SecurityRegressionDto[]>([]);
  const [selectedRegression, setSelectedRegression] = useState<SecurityRegressionDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadRegressionData(selectedTargetId);
    }
  }, [selectedTargetId, filterType, filterStatus]);

  const loadTargets = async () => {
    try {
      const res = await targetApi.listTargets();
      setTargets(res);
      if (res.length > 0) {
        if (targetIdFromUrl && res.some((t) => t.id === targetIdFromUrl)) {
          setSelectedTargetId(targetIdFromUrl);
        } else {
          setSelectedTargetId(res[0].id);
        }
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load targets');
      setLoading(false);
    }
  };

  const loadRegressionData = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, listData] = await Promise.all([
        postureApi.getRegressionSummary(targetId),
        postureApi.getRegressions(targetId, filterType || undefined, undefined, filterStatus || undefined),
      ]);
      setSummary(sumData);
      setRegressions(listData);
    } catch (err: any) {
      setError(err.message || 'Failed to load regression records');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: RegressionType) => {
    switch (type) {
      case 'REOPENED':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', label: 'REOPENED' };
      case 'REGRESSED':
        return { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3', label: 'REGRESSED' };
      case 'DEFENSE_REGRESSION':
        return { bg: '#fefce8', text: '#d97706', border: '#fde047', label: 'DEFENSE REGRESSION' };
      default:
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: type };
    }
  };

  const getStatusBadge = (status: RegressionStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', label: 'CONFIRMED' };
      case 'POTENTIAL':
        return { bg: '#fefce8', text: '#d97706', border: '#fde047', label: 'POTENTIAL' };
      case 'RESOLVED':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'RESOLVED' };
      default:
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: 'INCONCLUSIVE' };
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
            <RotateCcw size={22} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Vulnerability Regression Center
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Historical re-appearance tracking, cryptographic vulnerability fingerprint matching, and retest verification.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {targets.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TargetIcon size={16} style={{ color: 'var(--brand-primary)' }} />
              <select
                value={selectedTargetId}
                onChange={(e) => {
                  setSelectedTargetId(e.target.value);
                  setSearchParams({ targetId: e.target.value });
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.primaryUrl})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadRegressionData(selectedTargetId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: '#f0f7ff',
              border: '1px solid var(--border-subtle)',
              color: 'var(--brand-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#dc2626',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Regression KPI Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Events</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{summary.totalRegressions}</div>
          </div>
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirmed</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{summary.confirmedRegressions}</div>
          </div>
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Potential</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{summary.potentialRegressions}</div>
          </div>
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resolved</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{summary.resolvedRegressions}</div>
          </div>
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Regression Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '4px' }}>
              {summary.regressionRate >= 0 ? `${summary.regressionRate}%` : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Regressions List & Filters */}
      <div
        style={{
          background: 'var(--surface-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} style={{ color: '#dc2626' }} />
            Detected Vulnerability Regressions ({regressions.length})
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            >
              <option value="">All Types</option>
              <option value="REOPENED">REOPENED</option>
              <option value="REGRESSED">REGRESSED</option>
              <option value="DEFENSE_REGRESSION">DEFENSE REGRESSION</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="POTENTIAL">POTENTIAL</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
            <div>Fetching regression audit records...</div>
          </div>
        ) : regressions.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <CheckCircle2 size={36} style={{ color: '#059669', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              No Vulnerability Regressions Detected
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
              None of the previously fixed findings or defense controls have reappeared on this target.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Finding Title</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Fingerprint</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Confidence</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Detected At</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {regressions.map((reg) => {
                  const typeB = getTypeBadge(reg.regressionType);
                  const statusB = getStatusBadge(reg.status);
                  return (
                    <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {reg.findingTitle}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {reg.findingFingerprint ? `${reg.findingFingerprint.substring(0, 12)}...` : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: typeB.bg, color: typeB.text, border: `1px solid ${typeB.border}` }}>
                          {typeB.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {reg.confidence}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: statusB.bg, color: statusB.text, border: `1px solid ${statusB.border}` }}>
                          {statusB.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        {new Date(reg.detectedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRegression(reg)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            color: '#0369a1',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Regression Detail Inspector Modal */}
      {selectedRegression && (
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
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={18} style={{ color: '#dc2626' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Regression Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedRegression(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Finding Title</label>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedRegression.findingTitle}</div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Fingerprint (SHA-256)</label>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', wordBreak: 'break-all' }}>
                  {selectedRegression.findingFingerprint}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Type</label>
                  {(() => {
                    const b = getTypeBadge(selectedRegression.regressionType);
                    return <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: b.bg, color: b.text, border: `1px solid ${b.border}` }}>{b.label}</span>;
                  })()}
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Status</label>
                  {(() => {
                    const b = getStatusBadge(selectedRegression.status);
                    return <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: b.bg, color: b.text, border: `1px solid ${b.border}` }}>{b.label}</span>;
                  })()}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Explanation / Evidence</label>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedRegression.explanation}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                <span>Detected: {new Date(selectedRegression.detectedAt).toLocaleString()}</span>
                <span>Confidence: <strong>{selectedRegression.confidence}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button
                onClick={() => setSelectedRegression(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
