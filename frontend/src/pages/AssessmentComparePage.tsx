import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Layers,
  RefreshCw,
  Target as TargetIcon,
} from 'lucide-react';
import { postureApi } from '../services/api/postureApi';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { SecurityTarget } from '../types/target';
import { Assessment } from '../types/assessment';
import { AssessmentComparisonDto } from '../types/posture';

export const AssessmentComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetIdFromUrl = searchParams.get('targetId') || '';

  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetIdFromUrl);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [prevAssessmentId, setPrevAssessmentId] = useState<string>('');
  const [currAssessmentId, setCurrAssessmentId] = useState<string>('');
  const [comparison, setComparison] = useState<AssessmentComparisonDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadAssessments(selectedTargetId);
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load targets');
    }
  };

  const loadAssessments = async (targetId: string) => {
    try {
      const res = await assessmentApi.listAssessments(targetId);
      const items = res.content || [];
      setAssessments(items);
      if (items.length >= 2) {
        setCurrAssessmentId(items[0].id);
        setPrevAssessmentId(items[1].id);
      } else if (items.length === 1) {
        setCurrAssessmentId(items[0].id);
        setPrevAssessmentId('');
      } else {
        setCurrAssessmentId('');
        setPrevAssessmentId('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load target assessments');
    }
  };

  const handleCompare = async () => {
    if (!selectedTargetId || !currAssessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await postureApi.compareAssessments(
        selectedTargetId,
        currAssessmentId,
        prevAssessmentId || undefined
      );
      setComparison(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute assessment comparison');
    } finally {
      setLoading(false);
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
          flexDirection: 'column',
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
            <GitCompare size={22} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Assessment-to-Assessment Comparison
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Deterministic delta comparison across findings, posture score movements, and attack surface alterations.
            </p>
          </div>
        </div>

        {/* Selectors Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Target Scope
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => {
                setSelectedTargetId(e.target.value);
                setSearchParams({ targetId: e.target.value });
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.primaryUrl})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Previous Assessment (Baseline)
            </label>
            <select
              value={prevAssessmentId}
              onChange={(e) => setPrevAssessmentId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            >
              <option value="">(None - Initial Baseline)</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  Assessment {a.id.substring(0, 8)} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Current Assessment
            </label>
            <select
              value={currAssessmentId}
              onChange={(e) => setCurrAssessmentId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  Assessment {a.id.substring(0, 8)} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleCompare}
              disabled={loading || !currAssessmentId}
              style={{
                width: '100%',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: loading || !currAssessmentId ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Compare Assessments</span>
            </button>
          </div>
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

      {/* Comparison Results */}
      {comparison && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metrics summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score Shift</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '4px' }}>
                {comparison.previousScore ?? 'N/A'} → {comparison.currentScore ?? 'N/A'}
              </div>
            </div>

            <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>New Findings</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                {comparison.newFindings.length}
              </div>
            </div>

            <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fixed Findings</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {comparison.fixedFindings.length}
              </div>
            </div>

            <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unchanged</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '4px' }}>
                {comparison.unchangedFindings.length}
              </div>
            </div>

            <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reopened</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#e11d48', marginTop: '4px' }}>
                {comparison.reopenedFindings.length}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Delta Analysis:</strong> {comparison.summaryExplanation}
          </div>

          {/* New Findings Matrix */}
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
              <AlertTriangle size={15} />
              Newly Introduced Findings ({comparison.newFindings.length})
            </div>

            {comparison.newFindings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {comparison.newFindings.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>{item.endpoint}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#dc2626', color: '#ffffff' }}>
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                No newly introduced findings identified in current assessment.
              </div>
            )}
          </div>

          {/* Remediated Findings Matrix */}
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
              <CheckCircle2 size={15} />
              Remediated / Fixed Findings ({comparison.fixedFindings.length})
            </div>

            {comparison.fixedFindings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {comparison.fixedFindings.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '2px' }}>{item.endpoint}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#059669', color: '#ffffff' }}>
                      FIXED
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                No previous findings resolved in this assessment.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
