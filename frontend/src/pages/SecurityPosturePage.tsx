import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Activity,
  History,
  ArrowRight,
  Target as TargetIcon,
  Zap,
} from 'lucide-react';
import { postureApi } from '../services/api/postureApi';
import { targetApi } from '../services/api/targetApi';
import { SecurityTarget } from '../types/target';
import {
  SecurityPostureSnapshotDto,
  SecurityPostureDimensionDto,
  PostureScoreFactorDto,
  PostureTrendPointDto,
  PostureRiskLevel,
  PostureDimensionType,
} from '../types/posture';

export const SecurityPosturePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetIdFromUrl = searchParams.get('targetId') || '';

  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetIdFromUrl);
  const [posture, setPosture] = useState<SecurityPostureSnapshotDto | null>(null);
  const [trends, setTrends] = useState<PostureTrendPointDto[]>([]);
  const [history, setHistory] = useState<SecurityPostureSnapshotDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<SecurityPostureDimensionDto | null>(null);

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadPostureData(selectedTargetId);
    }
  }, [selectedTargetId]);

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

  const loadPostureData = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [posData, trendData, histData] = await Promise.all([
        postureApi.getCurrentPosture(targetId),
        postureApi.getPostureTrends(targetId),
        postureApi.getPostureHistory(targetId),
      ]);
      setPosture(posData);
      setTrends(trendData);
      setHistory(histData);
      if (posData.dimensions && posData.dimensions.length > 0) {
        setSelectedDimension(posData.dimensions[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load posture data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedTargetId) return;
    setRecalculating(true);
    try {
      const updated = await postureApi.recalculatePosture(selectedTargetId);
      setPosture(updated);
      await loadPostureData(selectedTargetId);
    } catch (err: any) {
      setError(err.message || 'Failed to recalculate security posture');
    } finally {
      setRecalculating(false);
    }
  };

  const getRiskBadge = (risk: PostureRiskLevel) => {
    switch (risk) {
      case 'EXCELLENT':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'EXCELLENT' };
      case 'GOOD':
        return { bg: '#eff6ff', text: '#0284c7', border: '#bae6fd', label: 'GOOD' };
      case 'MODERATE':
        return { bg: '#fefce8', text: '#d97706', border: '#fde047', label: 'MODERATE' };
      case 'HIGH_RISK':
        return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', label: 'HIGH RISK' };
      case 'CRITICAL_RISK':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', label: 'CRITICAL RISK' };
      default:
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: 'INSUFFICIENT DATA' };
    }
  };

  const formatDimensionName = (dim: PostureDimensionType) => {
    switch (dim) {
      case 'VULNERABILITY_RISK':
        return 'Vulnerability Risk';
      case 'ATTACK_SURFACE_RISK':
        return 'Attack Surface Risk';
      case 'CONFIGURATION_SECURITY':
        return 'Configuration Security';
      case 'REMEDIATION_HEALTH':
        return 'Remediation Health';
      case 'DEFENSE_VALIDATION':
        return 'Defense Validation';
      case 'REGRESSION_RISK':
        return 'Regression Risk';
      default:
        return dim;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Header Banner & Target Selector */}
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
            <ShieldCheck size={22} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Security Posture & Score
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Deterministic evidence-backed posture evaluation, explainable score factors, and historical drift.
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
            onClick={handleRecalculate}
            disabled={recalculating || !selectedTargetId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: recalculating ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
            }}
          >
            <RefreshCw size={14} className={recalculating ? 'spin' : ''} />
            {recalculating ? 'Computing...' : 'Recalculate Posture'}
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
          <div>Computing target security posture score and factors...</div>
        </div>
      ) : !posture ? (
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
            No Posture Snapshot Available
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 16px auto' }}>
            Run an assessment or trigger recalculation to generate security posture metrics and evidence factors.
          </p>
          <button
            onClick={handleRecalculate}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Compute Posture Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Score Hero Card */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            {/* Score Left Card */}
            <div
              style={{
                background: 'var(--surface-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Overall Security Posture Score
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '12px' }}>
                  <span style={{ fontSize: '56px', fontWeight: 900, color: 'var(--brand-primary)', lineHeight: 1 }}>
                    {posture.overallScore}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>/ 100</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                  {(() => {
                    const badge = getRiskBadge(posture.riskLevel);
                    return (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}

                  {posture.scoreDelta != null && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: posture.scoreDelta >= 0 ? '#ecfdf5' : '#fef2f2',
                        color: posture.scoreDelta >= 0 ? '#059669' : '#dc2626',
                        border: `1px solid ${posture.scoreDelta >= 0 ? '#a7f3d0' : '#fca5a5'}`,
                      }}
                    >
                      {posture.scoreDelta > 0 ? <TrendingUp size={12} /> : posture.scoreDelta < 0 ? <TrendingDown size={12} /> : null}
                      {posture.scoreDelta > 0 ? `+${posture.scoreDelta}` : posture.scoreDelta} shift
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Calculated: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(posture.calculatedAt).toLocaleString()}</strong></div>
                <div>Algorithm Version: <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{posture.scoreVersion}</strong></div>
              </div>
            </div>

            {/* Explanation Factor Highlights: Why this score? */}
            <div
              style={{
                background: 'var(--surface-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} style={{ color: 'var(--brand-primary)' }} />
                  Why This Score? (Contributing Evidence Factors)
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Grounded strictly in observed findings & configs
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {posture.factors && posture.factors.length > 0 ? (
                  posture.factors.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            background: f.impact >= 0 ? '#ecfdf5' : '#fef2f2',
                            color: f.impact >= 0 ? '#059669' : '#dc2626',
                            border: `1px solid ${f.impact >= 0 ? '#a7f3d0' : '#fca5a5'}`,
                          }}
                        >
                          {f.impact > 0 ? `+${f.impact}` : f.impact}
                        </span>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.factorName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{f.explanation}</div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                        }}
                      >
                        {f.dimension.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    Baseline posture evaluated with standard zero-offset factors.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Posture Dimensions Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} style={{ color: 'var(--brand-primary)' }} />
              Security Posture Dimensions
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {posture.dimensions.map((dim) => {
                const isSelected = selectedDimension?.id === dim.id;
                return (
                  <div
                    key={dim.id}
                    onClick={() => setSelectedDimension(dim)}
                    style={{
                      background: 'var(--surface-primary)',
                      border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      borderRadius: '10px',
                      padding: '16px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none',
                      transition: 'border 0.15s, box-shadow 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {formatDimensionName(dim.dimension)}
                        </span>
                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: 800,
                            color:
                              dim.score === null
                                ? 'var(--text-muted)'
                                : dim.score >= 80
                                ? '#059669'
                                : dim.score >= 60
                                ? '#d97706'
                                : '#dc2626',
                          }}
                        >
                          {dim.score != null ? `${dim.score}/100` : 'N/A'}
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {dim.explanation}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Evidence Count: <strong style={{ color: 'var(--text-primary)' }}>{dim.evidenceCount}</strong></span>
                      <span style={{ color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        Details <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Dimension Detail Inspector */}
          {selectedDimension && (
            <div
              style={{
                background: 'var(--surface-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Dimension Inspector: {formatDimensionName(selectedDimension.dimension)}
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedDimension.explanation}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {selectedDimension.score ?? 'N/A'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> / 100</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Contributing Dimension Factors
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedDimension.factors && selectedDimension.factors.length > 0 ? (
                    selectedDimension.factors.map((fac, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{fac.factorName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{fac.explanation}</div>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            background: fac.impact >= 0 ? '#ecfdf5' : '#fef2f2',
                            color: fac.impact >= 0 ? '#059669' : '#dc2626',
                            border: `1px solid ${fac.impact >= 0 ? '#a7f3d0' : '#fca5a5'}`,
                          }}
                        >
                          {fac.impact > 0 ? `+${fac.impact}` : fac.impact}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                      Standard baseline weights applied for this dimension.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historical Score Trend Points */}
          <div
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} style={{ color: 'var(--brand-primary)' }} />
              Historical Posture Score Drift ({trends.length} recorded checkpoints)
            </h3>

            {trends.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {trends.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {t.score}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {new Date(t.timestamp).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '10px', color: t.regressionCount > 0 ? '#dc2626' : '#059669', fontWeight: 600, marginTop: '2px' }}>
                      {t.regressionCount > 0 ? `${t.regressionCount} Regressions` : 'Stable'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                Historical drift timeline will expand automatically as assessments conclude over time.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
