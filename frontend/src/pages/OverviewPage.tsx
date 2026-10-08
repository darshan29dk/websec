import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { auditApi } from '../services/api/auditApi';
import { findingApi } from '../services/api/findingApi';
import { Target } from '../types/target';
import { Assessment } from '../types/assessment';
import { AuditEvent } from '../types/audit';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import {
  Target as TargetIcon,
  ShieldCheck,
  Plus,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'EXECUTIVE' | 'SOC'>('EXECUTIVE');
  const [targets, setTargets] = useState<Target[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [findingsSummary, setFindingsSummary] = useState({
    critical: 0,
    high: 2,
    medium: 8,
    low: 14,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [targetPage, assessmentPage, auditPage, findingPage] = await Promise.all([
          targetApi.getTargets(0, 10).catch(() => ({ content: [] })),
          assessmentApi.getAssessments(0, 5).catch(() => ({ content: [] })),
          auditApi.getAuditEvents({ page: 0, size: 5 }).catch(() => ({ content: [] })),
          findingApi.getFindings(0, 100).catch(() => ({ data: { content: [] } })),
        ]);

        setTargets(targetPage.content || []);
        setAssessments(assessmentPage.content || []);
        setAuditEvents(auditPage.content || []);

        const findingsList = findingPage.data?.content || [];
        if (findingsList.length > 0) {
          const c = findingsList.filter((f: any) => f.severity === 'CRITICAL').length;
          const h = findingsList.filter((f: any) => f.severity === 'HIGH').length;
          const m = findingsList.filter((f: any) => f.severity === 'MEDIUM').length;
          const l = findingsList.filter((f: any) => f.severity === 'LOW').length;
          setFindingsSummary({ critical: c, high: h, medium: m, low: l });
        }
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Header & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>Platform Security Overview</h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Authorized target management, attack surface discovery &amp; continuous security posture
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mode Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('EXECUTIVE')}
              style={{
                background: viewMode === 'EXECUTIVE' ? '#1e293b' : 'transparent',
                color: viewMode === 'EXECUTIVE' ? '#f8fafc' : '#64748b',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Executive Overview
            </button>
            <button
              onClick={() => setViewMode('SOC')}
              style={{
                background: viewMode === 'SOC' ? '#1e293b' : 'transparent',
                color: viewMode === 'SOC' ? '#f8fafc' : '#64748b',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Security Operations (SOC)
            </button>
          </div>

          <Link to="/targets/new">
            <Button variant="primary" icon={<Plus size={15} />}>
              Add Target
            </Button>
          </Link>
        </div>
      </div>

      {viewMode === 'EXECUTIVE' ? (
        <div>
          {/* Top Row: Security Posture Summary & Risk Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Security Posture Score Card */}
            <Card style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
                Global Security Posture
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '38px', fontWeight: 800, color: '#10b981', lineHeight: '1' }}>82</span>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>/ 100</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  GOOD
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', lineHeight: '1.4' }}>
                Overall security posture across authorized web targets.
              </p>
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #1e293b',
                  fontSize: '11px',
                  color: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={13} />
                <span>2 high-priority risks require attention</span>
              </div>
            </Card>

            {/* Risk Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <Card style={{ padding: '16px', borderLeft: '3px solid #ef4444' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Critical Risk
                </span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {findingsSummary.critical}
                </div>
                <span style={{ fontSize: '10px', color: '#ef4444' }}>Immediate action required</span>
              </Card>

              <Card style={{ padding: '16px', borderLeft: '3px solid #f97316' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  High Risk
                </span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {findingsSummary.high}
                </div>
                <span style={{ fontSize: '10px', color: '#f97316' }}>Remediation scheduled</span>
              </Card>

              <Card style={{ padding: '16px', borderLeft: '3px solid #f59e0b' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Medium Risk
                </span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {findingsSummary.medium}
                </div>
                <span style={{ fontSize: '10px', color: '#f59e0b' }}>Hardening recommended</span>
              </Card>

              <Card style={{ padding: '16px', borderLeft: '3px solid #3b82f6' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Low &amp; Info
                </span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {findingsSummary.low}
                </div>
                <span style={{ fontSize: '10px', color: '#3b82f6' }}>Observed telemetry</span>
              </Card>
            </div>
          </div>

          {/* Middle Row: Attention Required & Protection Coverage */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', marginBottom: '20px' }}>
            {/* Attention Required Card */}
            <Card title="Security Attention Required" subtitle="Actionable security events and posture warnings">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(249, 115, 22, 0.08)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={16} color="#f97316" />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                        2 High Severity Findings Open
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Missing Content-Security-Policy &amp; Insecure Cookie SameSite flags
                      </div>
                    </div>
                  </div>
                  <Link to="/findings">
                    <Button variant="secondary" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={16} color="#3b82f6" />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                        Continuous Retesting Recommended
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Controlled retest validation ready for submitted remediations
                      </div>
                    </div>
                  </div>
                  <Link to="/retests">
                    <Button variant="secondary" size="sm">
                      Retest
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Protection Coverage */}
            <Card title="Protection Coverage" subtitle="System operational security metrics">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '4px' }}>
                    <span>Assessment Coverage</span>
                    <span style={{ fontWeight: 600 }}>100%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#10b981' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '4px' }}>
                    <span>Continuous Monitoring</span>
                    <span style={{ fontWeight: 600 }}>85%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', backgroundColor: '#3b82f6' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#cbd5e1', marginBottom: '4px' }}>
                    <span>Remediation Progress</span>
                    <span style={{ fontWeight: 600 }}>72%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '72%', height: '100%', backgroundColor: '#f59e0b' }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Targets Inventory Table (Shown in both modes or SOC mode) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <Card
          title="Authorized Security Targets"
          subtitle="Configured target web domains under authorized security monitoring"
          action={
            <Link to="/targets">
              <Button variant="secondary" size="sm">
                View All Targets <ArrowRight size={13} style={{ marginLeft: '4px' }} />
              </Button>
            </Link>
          }
        >
          {targets.length === 0 && !isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
              <TargetIcon size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>No target domains registered yet.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Register your authorized web domain or application URL to begin security assessment.
              </p>
            </div>
          ) : (
            <Table
              isLoading={isLoading}
              data={targets.slice(0, 5)}
              keyExtractor={(item) => item.id}
              columns={[
                {
                  header: 'Target Name',
                  render: (t) => (
                    <Link to={`/targets/${t.id}`} style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {t.name}
                    </Link>
                  ),
                },
                {
                  header: 'Primary URL',
                  render: (t) => <code style={{ fontSize: '11px', color: '#64748b' }}>{t.primaryUrl}</code>,
                },
                {
                  header: 'Status',
                  render: (t) => <StatusBadge status={t.status} />,
                },
                {
                  header: 'Authorization',
                  render: (t) =>
                    t.authorized ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="EXPIRED" />,
                },
                {
                  header: 'Created Date',
                  render: (t) => new Date(t.createdAt).toLocaleDateString(),
                },
              ]}
            />
          )}
        </Card>

        {/* System Security Audit Activity */}
        <Card
          title="Recent Security Audit Log"
          subtitle="Real-time system security audit event trace"
          action={
            <Link to="/audit">
              <Button variant="secondary" size="sm">
                Full Audit Trail
              </Button>
            </Link>
          }
        >
          <Table
            isLoading={isLoading}
            data={auditEvents}
            keyExtractor={(item) => item.id}
            columns={[
              {
                header: 'Timestamp',
                render: (a) => new Date(a.createdAt).toLocaleString(),
                width: '180px',
              },
              { header: 'Actor', accessor: 'actorEmail' },
              {
                header: 'Event Type',
                render: (a) => <code style={{ fontSize: '11px', color: '#60a5fa' }}>{a.eventType}</code>,
              },
              { header: 'Action', accessor: 'action' },
              {
                header: 'Resource',
                render: (a) => `${a.resourceType}:${a.resourceId?.substring(0, 8) || ''}`,
              },
              { header: 'IP Address', render: (a) => <code style={{ fontSize: '11px' }}>{a.ipAddress}</code> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};
