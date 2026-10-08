import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { defenseApi } from '../services/api/defenseApi';
import { findingApi } from '../services/api/findingApi';
import {
  DefenseRecommendation,
  DefenseControl,
  DefenseOverviewMetrics,
} from '../types/defense';
import { SecurityFinding } from '../types/finding';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  RotateCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

interface EvaluatedControl extends DefenseControl {
  status: 'HEALTHY' | 'WARNING' | 'AT_RISK' | 'UNKNOWN';
  risk: string;
  evidence: string;
  recommendation: string;
  lastChecked: string;
  validationStatus: string;
}

const DEFAULT_CATEGORIES = [
  'Security Headers',
  'TLS',
  'Cookie Security',
  'CORS',
  'Authentication Security',
  'Rate Limiting',
  'WAF',
  'Logging & Monitoring',
  'Secrets Exposure',
  'Configuration',
];

export const DefenseOverviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('targetId') || '';

  const [metrics, setMetrics] = useState<DefenseOverviewMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<DefenseRecommendation[]>([]);
  const [controls, setControls] = useState<DefenseControl[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [selectedControl, setSelectedControl] = useState<EvaluatedControl | null>(null);
  const [selectedRec, setSelectedRec] = useState<DefenseRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState<'controls' | 'recommendations'>('controls');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, recs, ctrls, findRes] = await Promise.allSettled([
        defenseApi.getOverviewMetrics(),
        defenseApi.listRecommendations(),
        defenseApi.listControls(),
        findingApi.getFindings(0, 100, undefined, targetId || undefined),
      ]);

      if (m.status === 'fulfilled' && m.value) setMetrics(m.value);
      if (recs.status === 'fulfilled' && Array.isArray(recs.value)) setRecommendations(recs.value);
      if (ctrls.status === 'fulfilled' && Array.isArray(ctrls.value)) setControls(ctrls.value);
      if (findRes.status === 'fulfilled' && findRes.value?.content) setFindings(findRes.value.content);
    } catch (err) {
      console.error('Failed to load defense data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetId]);

  // Correlate controls with real assessment findings (Requirement 10)
  const evaluatedControls: EvaluatedControl[] = controls.map((ctrl) => {
    // Match findings against control title/category
    const relatedFinding = findings.find(
      (f) =>
        f.title.toLowerCase().includes(ctrl.name.toLowerCase()) ||
        f.description?.toLowerCase().includes(ctrl.controlCode.toLowerCase()) ||
        (ctrl.category && f.title.toLowerCase().includes(ctrl.category.toLowerCase()))
    );

    let status: 'HEALTHY' | 'WARNING' | 'AT_RISK' | 'UNKNOWN' = 'HEALTHY';
    let risk = 'Low residual risk';
    let evidence = 'No deviations or misconfigurations observed during assessment.';
    let recommendation = ctrl.implementationGuidance || 'Maintain baseline security configuration.';
    let validationStatus = 'PASS';

    if (findings.length === 0) {
      status = 'UNKNOWN';
      evidence = 'No assessments completed yet to evaluate this control.';
      validationStatus = 'NOT_EVALUATED';
    } else if (relatedFinding) {
      if (relatedFinding.severity === 'CRITICAL' || relatedFinding.severity === 'HIGH') {
        status = 'AT_RISK';
        risk = `${relatedFinding.severity} severity vulnerability observed`;
        evidence = relatedFinding.description || relatedFinding.title;
        recommendation = ctrl.implementationGuidance || relatedFinding.description || 'Remediate immediately';
        validationStatus = 'FAIL';
      } else {
        status = 'WARNING';
        risk = `${relatedFinding.severity} severity deviation noted`;
        evidence = relatedFinding.description || relatedFinding.title;
        recommendation = ctrl.implementationGuidance || relatedFinding.description || 'Hardening advised';
        validationStatus = 'WARN';
      }
    }

    return {
      ...ctrl,
      status,
      risk,
      evidence,
      recommendation,
      lastChecked: relatedFinding ? new Date(relatedFinding.createdAt).toLocaleDateString() : 'Active',
      validationStatus,
    };
  });

  const filteredControls = evaluatedControls.filter(
    (c) => !categoryFilter || c.category?.toLowerCase() === categoryFilter.toLowerCase()
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
            HEALTHY
          </span>
        );
      case 'WARNING':
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
            WARNING
          </span>
        );
      case 'AT_RISK':
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
            AT RISK
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1' }}>
            UNKNOWN
          </span>
        );
    }
  };

  const atRiskCount = evaluatedControls.filter((c) => c.status === 'AT_RISK').length;
  const warningCount = evaluatedControls.filter((c) => c.status === 'WARNING').length;
  const healthyCount = evaluatedControls.filter((c) => c.status === 'HEALTHY').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="#15803d" /> Defense Center &amp; Security Controls
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Evidence-grounded defense posture across HTTP headers, TLS, WAF, CORS, cookies, and authentication
          </p>
        </div>

        {targetId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Scope:</span>
            <code style={{ fontSize: '12px', color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px' }}>
              {targetId.substring(0, 8)}...
            </code>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Controls Monitored
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '6px' }}>
            {evaluatedControls.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Across 10 defense domains
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Healthy Controls
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
            {healthyCount}
          </div>
          <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
            Evidence validated
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Controls At Risk
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
            {atRiskCount}
          </div>
          <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
            Remediation required
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Controls With Warnings
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
            {warningCount}
          </div>
          <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
            Hardening recommended
          </div>
        </Card>
      </div>

      {/* Filter and Tab Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('controls')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'controls' ? 'var(--accent-light)' : 'transparent',
              color: activeTab === 'controls' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Defense Controls Matrix
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'recommendations' ? 'var(--accent-light)' : 'transparent',
              color: activeTab === 'recommendations' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Hardening Recommendations ({recommendations.length})
          </button>
        </div>

        {activeTab === 'controls' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--accent-primary)" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                backgroundColor: '#ffffff',
                color: 'var(--text-main)',
              }}
            >
              <option value="">All Categories</option>
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* CONTROLS MATRIX TAB (Requirement 10) */}
      {activeTab === 'controls' && (
        <Card title="Defense Controls Matrix" subtitle="Click any control to examine real evidence, risks, and implementation guidance">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading defense control matrix...
            </div>
          ) : filteredControls.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No defense controls match the selected category.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px' }}>Control</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Observed Evidence</th>
                    <th style={{ padding: '12px 16px' }}>Recommendation</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredControls.map((ctrl) => (
                    <tr
                      key={ctrl.id || ctrl.controlCode}
                      onClick={() => setSelectedControl(ctrl)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-light)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{ctrl.name}</div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {ctrl.controlCode}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          {ctrl.category || 'Configuration'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{getStatusBadge(ctrl.status)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ctrl.evidence}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ctrl.recommendation}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                          Inspect →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* RECOMMENDATIONS TAB */}
      {activeTab === 'recommendations' && (
        <Card title="Prescriptive Defense Recommendations" subtitle="Actionable hardening playbooks correlated to active assessment findings">
          {recommendations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No hardening recommendations generated. Run a security assessment to generate prescriptive defense actions.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
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
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
                          {rec.title}
                        </span>
                        <StatusBadge status={rec.status} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Priority: <strong>{rec.priority}</strong> • Category: {rec.recommendationType}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.4' }}>
                    {rec.summary}
                  </div>
                  {rec.implementationGuidance && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <strong>Implementation: </strong> {rec.implementationGuidance}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* CONTROL DETAIL MODAL (Requirement 10) */}
      {selectedControl && (
        <Modal
          isOpen={!!selectedControl}
          onClose={() => setSelectedControl(null)}
          title={`Defense Control: ${selectedControl.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Code: {selectedControl.controlCode}
                </span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginTop: '2px' }}>
                  Category: {selectedControl.category}
                </div>
              </div>
              {getStatusBadge(selectedControl.status)}
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Control Description
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-heading)', marginTop: '4px', lineHeight: '1.4' }}>
                {selectedControl.description || selectedControl.name}
              </div>
            </div>

            {/* Observed Evidence */}
            <div style={{ padding: '12px', backgroundColor: selectedControl.status === 'AT_RISK' ? '#fee2e2' : '#f8fafc', borderRadius: '6px', border: '1px solid', borderColor: selectedControl.status === 'AT_RISK' ? '#fca5a5' : 'var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: selectedControl.status === 'AT_RISK' ? '#991b1b' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                Observed Evidence
              </div>
              <div style={{ fontSize: '12px', color: selectedControl.status === 'AT_RISK' ? '#991b1b' : 'var(--text-main)', marginTop: '4px', lineHeight: '1.4' }}>
                {selectedControl.evidence}
              </div>
            </div>

            {/* Prescriptive Recommendation */}
            <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                Prescriptive Remediation &amp; Recommendation
              </div>
              <div style={{ fontSize: '12px', color: '#065f46', marginTop: '4px', lineHeight: '1.4' }}>
                {selectedControl.recommendation}
              </div>
            </div>

            {selectedControl.implementationGuidance && (
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Implementation Guidance
                </span>
                <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '4px', lineHeight: '1.4' }}>
                  {selectedControl.implementationGuidance}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="primary" onClick={() => setSelectedControl(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
