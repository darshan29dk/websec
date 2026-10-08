import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { auditApi } from '../services/api/auditApi';
import { findingApi } from '../services/api/findingApi';
import { incidentApi } from '../services/api/incidentApi';
import { investigationApi } from '../services/api/investigationApi';
import { forensicApi } from '../services/api/forensicApi';
import { monitoringApi } from '../services/api/monitoringApi';
import { toolsApi } from '../services/api/toolsApi';
import { Target } from '../types/target';
import { Assessment } from '../types/assessment';
import { AuditEvent } from '../types/audit';
import { SecurityFinding } from '../types/finding';
import { SecurityIncident } from '../types/incident';
import { Investigation } from '../types/investigation';
import { ForensicCase } from '../types/forensic';
import { MonitoringConfigurationDto } from '../types/monitoring';
import { SecurityToolStatus } from '../services/api/toolsApi';
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
  ShieldAlert,
  FolderGit2,
  Activity,
  Radio,
  Terminal,
  FileText,
  Clock,
  Layers,
  BarChart2,
  Lock,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'EXECUTIVE' | 'SOC'>('EXECUTIVE');
  const [targets, setTargets] = useState<Target[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [forensicCases, setForensicCases] = useState<ForensicCase[]>([]);
  const [monitoringConfigs, setMonitoringConfigs] = useState<MonitoringConfigurationDto[]>([]);
  const [tools, setTools] = useState<SecurityToolStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          targetPage,
          assessmentPage,
          auditPage,
          findingPage,
          incidentPage,
          investigationPage,
          forensicPage,
          monitoringData,
          toolsData,
        ] = await Promise.allSettled([
          targetApi.getTargets(0, 20),
          assessmentApi.getAssessments(0, 10),
          auditApi.getAuditEvents({ page: 0, size: 5 }),
          findingApi.getFindings(0, 100),
          incidentApi.getIncidents(0, 10),
          investigationApi.getInvestigations(0, 10),
          forensicApi.getCases({ size: 10 }),
          monitoringApi.getAllConfigurations(),
          toolsApi.getAllTools(),
        ]);

        if (targetPage.status === 'fulfilled' && targetPage.value?.content) {
          setTargets(targetPage.value.content);
        }
        if (assessmentPage.status === 'fulfilled' && assessmentPage.value?.content) {
          setAssessments(assessmentPage.value.content);
        }
        if (auditPage.status === 'fulfilled' && auditPage.value?.content) {
          setAuditEvents(auditPage.value.content);
        }
        if (findingPage.status === 'fulfilled' && findingPage.value?.content) {
          setFindings(findingPage.value.content);
        }
        if (incidentPage.status === 'fulfilled' && incidentPage.value?.content) {
          setIncidents(incidentPage.value.content);
        }
        if (investigationPage.status === 'fulfilled' && investigationPage.value?.content) {
          setInvestigations(investigationPage.value.content);
        }
        if (forensicPage.status === 'fulfilled' && forensicPage.value?.content) {
          setForensicCases(forensicPage.value.content);
        }
        if (monitoringData.status === 'fulfilled' && Array.isArray(monitoringData.value)) {
          setMonitoringConfigs(monitoringData.value);
        }
        if (toolsData.status === 'fulfilled' && Array.isArray(toolsData.value)) {
          setTools(toolsData.value);
        }
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute actual counts from real data
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL');
  const highFindings = findings.filter((f) => f.severity === 'HIGH');
  const mediumFindings = findings.filter((f) => f.severity === 'MEDIUM');
  const lowFindings = findings.filter((f) => f.severity === 'LOW' || f.severity === 'INFO');

  const openIncidents = incidents.filter((i) => i.status === 'NEW' || i.status === 'OPEN' || i.status === 'INVESTIGATING');
  const activeInvestigations = investigations.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'NOT_STARTED');
  const activeMonitoring = monitoringConfigs.filter((m) => m.enabled);
  const failedAssessments = assessments.filter((a) => a.status === 'FAILED');

  // Compute calculated posture score based on real findings
  const computePostureScore = () => {
    if (targets.length === 0) return 100;
    let score = 100;
    score -= criticalFindings.length * 15;
    score -= highFindings.length * 8;
    score -= mediumFindings.length * 3;
    score -= lowFindings.length * 1;
    return Math.max(0, Math.min(100, score));
  };
  const postureScore = computePostureScore();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)' }}>
            Platform Security Overview
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Authorized target management, attack surface discovery &amp; continuous security posture
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mode Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('EXECUTIVE')}
              style={{
                background: viewMode === 'EXECUTIVE' ? 'var(--accent-light)' : 'transparent',
                color: viewMode === 'EXECUTIVE' ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 14px',
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
                background: viewMode === 'SOC' ? 'var(--accent-light)' : 'transparent',
                color: viewMode === 'SOC' ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 14px',
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
          {/* Top Row: Security Posture Summary & Clickable Risk Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Security Posture Score Card (Clickable to /posture) */}
            <div
              onClick={() => navigate('/posture')}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Global Security Posture
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '38px',
                    fontWeight: 800,
                    color: postureScore >= 80 ? '#15803d' : postureScore >= 60 ? '#b45309' : '#dc2626',
                    lineHeight: '1',
                  }}
                >
                  {postureScore}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: postureScore >= 80 ? '#ecfdf5' : postureScore >= 60 ? '#fffbeb' : '#fef2f2',
                    color: postureScore >= 80 ? '#047857' : postureScore >= 60 ? '#b45309' : '#b91c1c',
                    border: '1px solid',
                    borderColor: postureScore >= 80 ? '#a7f3d0' : postureScore >= 60 ? '#fde68a' : '#fca5a5',
                  }}
                >
                  {postureScore >= 80 ? 'STRONG' : postureScore >= 60 ? 'WARNING' : 'AT RISK'}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: '1.4' }}>
                Evaluated from real vulnerability findings, exposed endpoints, and attack surface.
              </p>
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '11.5px',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Inspect Posture Dimensions</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Clickable Risk Summary Grid (Requirement 6) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {/* Critical Findings */}
              <div
                onClick={() => navigate('/findings?severity=CRITICAL')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fca5a5')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Critical Risk
                  </span>
                  <ShieldAlert size={16} color="#dc2626" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
                  {criticalFindings.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Immediate fix required →
                </div>
              </div>

              {/* High Findings */}
              <div
                onClick={() => navigate('/findings?severity=HIGH')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid #f97316',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fdba74')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    High Risk
                  </span>
                  <AlertTriangle size={16} color="#ea580c" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
                  {highFindings.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Remediation pending →
                </div>
              </div>

              {/* Medium Findings */}
              <div
                onClick={() => navigate('/findings?severity=MEDIUM')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fde68a')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Medium Risk
                  </span>
                  <AlertTriangle size={16} color="#d97706" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
                  {mediumFindings.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Hardening suggested →
                </div>
              </div>

              {/* Low & Info Findings */}
              <div
                onClick={() => navigate('/findings?severity=LOW')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid #0284c7',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#7dd3fc')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Low &amp; Info
                  </span>
                  <Lock size={16} color="#0284c7" />
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
                  {lowFindings.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Observed signals →
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Attention Required & Quick Access Hub */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', marginBottom: '20px' }}>
            {/* Attention Required Card (Real findings, No fake data) */}
            <Card title="Security Attention Required" subtitle="Live findings and critical items requiring attention">
              {criticalFindings.length === 0 && highFindings.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={32} color="#15803d" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                    No Critical or High Vulnerabilities Open
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>
                    All scanned targets meet core security baseline parameters.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[...criticalFindings, ...highFindings].slice(0, 4).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => navigate(`/findings/${f.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        backgroundColor: f.severity === 'CRITICAL' ? '#fef2f2' : '#fff7ed',
                        border: '1px solid',
                        borderColor: f.severity === 'CRITICAL' ? '#fca5a5' : '#fdba74',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={16} color={f.severity === 'CRITICAL' ? '#dc2626' : '#ea580c'} />
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-heading)' }}>
                            {f.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Severity: <strong>{f.severity}</strong> • Source: {f.source || 'Engine'}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        Inspect →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Platform Quick Links (All navigable with preserved parameters) */}
            <Card title="Operational Resources" subtitle="Direct access to core security engines">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  onClick={() => navigate('/incidents?status=OPEN')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={14} color="#dc2626" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>Open Incidents</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>
                    {openIncidents.length} Active
                  </span>
                </div>

                <div
                  onClick={() => navigate('/investigations')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="var(--accent-primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>Investigations</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {activeInvestigations.length} Cases
                  </span>
                </div>

                <div
                  onClick={() => navigate('/forensics')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderGit2 size={14} color="var(--accent-primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>Digital Forensics</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-heading)' }}>
                    {forensicCases.length} Records
                  </span>
                </div>

                <div
                  onClick={() => navigate('/monitoring')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={14} color="#15803d" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>Continuous Monitoring</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
                    {activeMonitoring.length} Active
                  </span>
                </div>

                <div
                  onClick={() => navigate('/assessments?status=FAILED')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} color="var(--accent-primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>Assessments</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: failedAssessments.length > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                    {failedAssessments.length > 0 ? `${failedAssessments.length} Failed` : `${assessments.length} Total`}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* SOC MODE VIEW (Previously rendered null!) */
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {/* Real Security Tools Status */}
            <Card
              title="Security Tool Health"
              subtitle="Operational status of allowlisted scanning binaries"
              action={
                <Link to="/system/tools">
                  <Button variant="secondary" size="sm">
                    Manage Tools
                  </Button>
                </Link>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tools.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0' }}>
                    Checking security tool binaries...
                  </div>
                ) : (
                  tools.slice(0, 5).map((t) => (
                    <div
                      key={t.toolName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Terminal size={14} color="var(--accent-primary)" />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                          {t.toolName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: t.status === 'AVAILABLE' ? '#ecfdf5' : '#fef2f2',
                          color: t.status === 'AVAILABLE' ? '#047857' : '#b91c1c',
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Active Incident Triage */}
            <Card
              title="Active Incidents"
              subtitle="Detected security events elevated to incident status"
              action={
                <Link to="/incidents">
                  <Button variant="secondary" size="sm">
                    All Incidents
                  </Button>
                </Link>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {incidents.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0', textAlign: 'center' }}>
                    No security incidents recorded.
                  </div>
                ) : (
                  incidents.slice(0, 4).map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      style={{
                        padding: '8px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                          {inc.title}
                        </span>
                        <StatusBadge status={inc.status} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Target: {targets.find(t => t.id === inc.targetId)?.name || `#${inc.targetId.substring(0, 8)}`} • Severity: {inc.severity}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Active Investigations */}
            <Card
              title="Investigation Workspaces"
              subtitle="Hypothesis-driven analyst workspaces"
              action={
                <Link to="/investigations">
                  <Button variant="secondary" size="sm">
                    Workspace
                  </Button>
                </Link>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {investigations.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0', textAlign: 'center' }}>
                    No open investigations.
                  </div>
                ) : (
                  investigations.slice(0, 4).map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => navigate(`/investigations/${inv.id}`)}
                      style={{
                        padding: '8px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                          {inv.primaryHypothesis || `Investigation #${inv.id.substring(0, 8)}`}
                        </span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Created by: {inv.createdBy || 'Analyst'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Targets Inventory Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>
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
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <TargetIcon size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
                No target domains registered yet.
              </p>
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
                    <Link to={`/targets/${t.id}`} style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                      {t.name}
                    </Link>
                  ),
                },
                {
                  header: 'Primary URL',
                  render: (t) => <code style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>{t.primaryUrl}</code>,
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
                {
                  header: 'Security Work',
                  render: (t) => (
                    <Link to={`/targets/${t.id}`} style={{ fontSize: '12px', fontWeight: 600 }}>
                      View Work Performed →
                    </Link>
                  ),
                },
              ]}
            />
          )}
        </Card>
      </div>

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
              render: (a) => <code style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>{a.eventType}</code>,
            },
            { header: 'Action', accessor: 'action' },
            {
              header: 'Resource',
              render: (a) => `${a.resourceType}:${a.resourceId?.substring(0, 8) || ''}`,
            },
            { header: 'IP Address', render: (a) => <code style={{ fontSize: '11px' }}>{a.ipAddress || 'Internal'}</code> },
          ]}
        />
      </Card>
    </div>
  );
};
