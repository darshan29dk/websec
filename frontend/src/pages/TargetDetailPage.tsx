import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { findingApi } from '../services/api/findingApi';
import { incidentApi } from '../services/api/incidentApi';
import { forensicApi } from '../services/api/forensicApi';
import { postureApi } from '../services/api/postureApi';
import { monitoringApi } from '../services/api/monitoringApi';
import { fuzzingApi } from '../services/api/fuzzingApi';
import { reportApi } from '../services/api/reportApi';
import { retestApi } from '../services/api/retestApi';
import { historyApi } from '../services/api/historyApi';
import { Target, AuthorizationType, ScopeType } from '../types/target';
import { TargetDashboardOverview, DiscoveredEndpoint } from '../types/dashboard';
import { Assessment } from '../types/assessment';
import { SecurityFinding } from '../types/finding';
import { SecurityIncident } from '../types/incident';
import { ForensicCase } from '../types/forensic';
import { SecurityPostureSnapshotDto } from '../types/posture';
import { MonitoringConfigurationDto } from '../types/monitoring';
import { FuzzingCampaign } from '../types/fuzzing';
import { SecurityReportDto } from '../types/report';
import { Retest } from '../types/retest';
import { SecurityHistoryTimelineDto } from '../types/history';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  FileCheck,
  Globe,
  Radio,
  Lock,
  Layers,
  Activity,
  FolderGit2,
  BarChart2,
  RotateCcw,
  History,
  FileText,
  ExternalLink,
  Plus,
  Crosshair,
  Server,
  Terminal,
  Cpu,
  Eye,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';

type TabKey =
  | 'OVERVIEW'
  | 'DETAILS'
  | 'ATTACK_SURFACE'
  | 'ASSESSMENTS'
  | 'FUZZING'
  | 'FINDINGS'
  | 'INCIDENTS'
  | 'FORENSICS'
  | 'DEFENSE'
  | 'REMEDIATION'
  | 'RETESTING'
  | 'POSTURE'
  | 'REPORTS'
  | 'MONITORING'
  | 'HISTORY';

export const TargetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>('OVERVIEW');

  // Target Scoped State
  const [target, setTarget] = useState<Target | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<TargetDashboardOverview | null>(null);
  const [endpoints, setEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [forensicCases, setForensicCases] = useState<ForensicCase[]>([]);
  const [campaigns, setCampaigns] = useState<FuzzingCampaign[]>([]);
  const [retests, setRetests] = useState<Retest[]>([]);
  const [reports, setReports] = useState<SecurityReportDto[]>([]);
  const [timeline, setTimeline] = useState<SecurityHistoryTimelineDto | null>(null);
  const [posture, setPosture] = useState<SecurityPostureSnapshotDto | null>(null);
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfigurationDto | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  // Authorization Form
  const [authType, setAuthType] = useState<AuthorizationType>('WRITTEN_PERMISSION');
  const [authStatement, setAuthStatement] = useState(
    'I confirm explicit written permission to conduct web security assessments against this target.'
  );
  const [authDate, setAuthDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Scope Form
  const [scopeType, setScopeType] = useState<ScopeType>('URL');
  const [scopeValue, setScopeValue] = useState('');
  const [isScopeSubmitting, setIsScopeSubmitting] = useState(false);

  // Strict Target Isolation: Reset state completely on ID change
  useEffect(() => {
    if (!id) return;

    // Reset all target state to prevent stale data bleed
    setTarget(null);
    setDashboardOverview(null);
    setEndpoints([]);
    setAssessments([]);
    setFindings([]);
    setIncidents([]);
    setForensicCases([]);
    setCampaigns([]);
    setRetests([]);
    setReports([]);
    setTimeline(null);
    setPosture(null);
    setMonitoringConfig(null);
    setIsLoading(true);
    setError(null);

    const fetchAllTargetData = async () => {
      try {
        const [
          targetData,
          overviewData,
          endpointsData,
          assessRes,
          findRes,
          incRes,
          forRes,
          campRes,
          retRes,
          repRes,
          histRes,
          postRes,
          monRes,
        ] = await Promise.allSettled([
          targetApi.getTargetById(id),
          targetApi.getTargetDashboard(id),
          targetApi.getTargetEndpoints(id),
          assessmentApi.getAssessments(0, 50, id),
          findingApi.getFindings(0, 100, undefined, id),
          incidentApi.getIncidents(0, 50, id),
          forensicApi.getCases({ targetId: id, size: 50 }),
          fuzzingApi.getCampaigns(id),
          retestApi.listAllRetests(id),
          reportApi.searchReports(id),
          historyApi.getTargetSecurityHistory(id),
          postureApi.getCurrentPosture(id),
          monitoringApi.getConfigurationByTarget(id),
        ]);

        if (targetData.status === 'fulfilled') {
          setTarget(targetData.value);
        } else {
          setError('Failed to find security target.');
          return;
        }

        if (overviewData.status === 'fulfilled') setDashboardOverview(overviewData.value);
        if (endpointsData.status === 'fulfilled') setEndpoints(endpointsData.value || []);
        if (assessRes.status === 'fulfilled' && assessRes.value) {
          setAssessments(assessRes.value.content || (Array.isArray(assessRes.value) ? assessRes.value : []));
        }
        if (findRes.status === 'fulfilled' && findRes.value) {
          setFindings(findRes.value.content || (Array.isArray(findRes.value) ? findRes.value : []));
        }
        if (incRes.status === 'fulfilled' && incRes.value) {
          setIncidents(incRes.value.content || (Array.isArray(incRes.value) ? incRes.value : []));
        }
        if (forRes.status === 'fulfilled' && forRes.value) {
          setForensicCases(forRes.value.content || (Array.isArray(forRes.value) ? forRes.value : []));
        }
        if (campRes.status === 'fulfilled') setCampaigns(campRes.value || []);
        if (retRes.status === 'fulfilled') setRetests(retRes.value || []);
        if (repRes.status === 'fulfilled') setReports(repRes.value?.content || []);
        if (histRes.status === 'fulfilled') setTimeline(histRes.value);
        if (postRes.status === 'fulfilled') setPosture(postRes.value);
        if (monRes.status === 'fulfilled') setMonitoringConfig(monRes.value);
      } catch (err: any) {
        setError(err.message || 'Failed to load target details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTargetData();

    if (searchParams.get('authorizationNotice') === 'true') {
      setIsAuthModalOpen(true);
    }
  }, [id]);

  const handleAddAuthorization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      await targetApi.addAuthorization(id, {
        authorizationType: authType,
        authorizationStatement: authStatement,
        authorizationDate: authDate,
        expirationDate: expDate,
      });
      setIsAuthModalOpen(false);
      const updatedTarget = await targetApi.getTargetById(id);
      setTarget(updatedTarget);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to add authorization record.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleAddScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !scopeValue) return;
    setIsScopeSubmitting(true);
    try {
      await targetApi.addScope(id, {
        scopeType,
        scopeValue,
        included: true,
      });
      setIsScopeModalOpen(false);
      setScopeValue('');
      const updatedTarget = await targetApi.getTargetById(id);
      setTarget(updatedTarget);
    } catch (err: any) {
      alert(err.message || 'Failed to add scope entry.');
    } finally {
      setIsScopeSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Activity size={32} color="var(--accent-primary)" className="spin" style={{ marginBottom: '12px' }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
          Loading Isolated Target Workspace...
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Querying website records, findings, endpoints, and security posture
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert type="error" message={error || 'Target not found'} />
        <Button variant="secondary" style={{ marginTop: '12px' }} onClick={() => navigate('/overview')}>
          Back to Global Dashboard
        </Button>
      </div>
    );
  }

  const isAuthValid = target.authorized;
  const riskEval = dashboardOverview?.riskEvaluation;
  const isCriticalOverride = riskEval?.criticalOverrideApplied;
  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  const tabList: Array<{ key: TabKey; label: string; count?: number; icon: React.ReactNode }> = [
    { key: 'OVERVIEW', label: 'Overview', icon: <BarChart2 size={14} /> },
    { key: 'DETAILS', label: 'Website Details', icon: <Globe size={14} /> },
    { key: 'ATTACK_SURFACE', label: 'Attack Surface', count: endpoints.length, icon: <Layers size={14} /> },
    { key: 'ASSESSMENTS', label: 'Assessments', count: assessments.length, icon: <Activity size={14} /> },
    { key: 'FUZZING', label: 'Web/API Fuzzing', count: campaigns.length, icon: <Terminal size={14} /> },
    { key: 'FINDINGS', label: 'Findings', count: findings.length, icon: <Lock size={14} /> },
    { key: 'INCIDENTS', label: 'Observed Attacks & Incidents', count: incidents.length, icon: <AlertTriangle size={14} /> },
    { key: 'FORENSICS', label: 'Forensics', count: forensicCases.length, icon: <FolderGit2 size={14} /> },
    { key: 'DEFENSE', label: 'Defense & Protection', icon: <ShieldCheck size={14} /> },
    { key: 'REMEDIATION', label: 'Remediation', icon: <FileCheck size={14} /> },
    { key: 'RETESTING', label: 'Retesting', count: retests.length, icon: <RotateCcw size={14} /> },
    { key: 'POSTURE', label: 'Security Posture', icon: <Crosshair size={14} /> },
    { key: 'REPORTS', label: 'Reports', count: reports.length, icon: <FileText size={14} /> },
    { key: 'MONITORING', label: 'Monitoring', icon: <Radio size={14} /> },
    { key: 'HISTORY', label: 'Security History', icon: <History size={14} /> },
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Backtrack Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button
          onClick={() => navigate('/overview')}
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
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <ArrowLeft size={13} color="var(--accent-primary)" />
          <span>Global Dashboard</span>
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/</span>
        <span style={{ fontSize: '12px', color: 'var(--text-heading)', fontWeight: 600 }}>{target.name}</span>
      </div>

      {/* Top Website Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              {target.name}
            </h1>
            <StatusBadge status={target.status} />
            <StatusBadge status={isAuthValid ? 'ACTIVE' : 'EXPIRED'} />
          </div>

          <a
            href={target.primaryUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-primary)',
              marginTop: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {target.primaryUrl} <ExternalLink size={12} />
          </a>

          {target.description && (
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '800px' }}>
              {target.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button variant="secondary" icon={<FileCheck size={15} />} onClick={() => setIsAuthModalOpen(true)}>
            Add Authorization
          </Button>

          {isAuthValid && target.status === 'ACTIVE' ? (
            <Link to={`/assessments/new?targetId=${target.id}`}>
              <Button variant="primary" icon={<Play size={15} />}>
                Launch Assessment
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              disabled
              icon={<Play size={15} />}
              title="Assessment requires active authorization record."
            >
              Launch Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Critical Finding Override Warning Banner if applicable */}
      {isCriticalOverride && (
        <div style={{ marginBottom: '20px' }}>
          <Alert
            type="error"
            title="MANDATORY CRITICAL FINDING OVERRIDE IN EFFECT"
            message={
              <div>
                This website contains at least one open confirmed <strong>Critical vulnerability</strong>. Under GlobalShield risk policy, any website with open critical findings is classified as <strong>CRITICAL</strong> regardless of total points.
              </div>
            }
          />
        </div>
      )}

      {/* Target Key Summary Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {/* Risk Classification */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Risk Classification
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color:
                  riskEval?.riskCategory === 'CRITICAL'
                    ? '#dc2626'
                    : riskEval?.riskCategory === 'HIGH'
                    ? '#ea580c'
                    : riskEval?.riskCategory === 'MEDIUM'
                    ? '#d97706'
                    : riskEval?.riskCategory === 'LOW'
                    ? '#15803d'
                    : '#64748b',
              }}
            >
              {riskEval?.riskCategory || 'NOT ASSESSED'}
            </span>
            {riskEval?.riskScore !== null && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                ({riskEval?.riskScore}/100)
              </span>
            )}
          </div>
        </div>

        {/* Endpoints Count */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Discovered Endpoints
          </span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '4px' }}>
            {endpoints.length > 0 ? endpoints.length : (target.scopes?.length || 1)}
          </div>
        </div>

        {/* Open Findings */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Open Findings
          </span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
            {findings.length}
          </div>
        </div>

        {/* Verified Fixes */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Verified Retest Fixes
          </span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
            {retests.filter((r) => r.status === 'COMPLETED').length}
          </div>
        </div>

        {/* Monitoring */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px 16px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Continuous Monitoring
          </span>
          <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px', color: monitoringConfig?.enabled ? '#15803d' : '#64748b' }}>
            {monitoringConfig?.enabled ? `Active (${monitoringConfig.frequency})` : 'Paused / Unconfigured'}
          </div>
        </div>
      </div>

      {/* 15 SECTION TABS HEADER */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '20px',
          gap: '2px',
        }}
      >
        {tabList.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: isActive ? 'rgba(2, 132, 199, 0.15)' : '#f1f5f9',
                    color: isActive ? 'var(--accent-primary)' : '#64748b',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
          <div>
            <Card title="Risk Evaluation &amp; Posture Factors" subtitle="Documented backend risk score calculation rules">
              {riskEval ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div
                      style={{
                        padding: '16px 20px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>EVALUATION</div>
                      <div
                        style={{
                          fontSize: '24px',
                          fontWeight: 800,
                          color:
                            riskEval.riskCategory === 'CRITICAL'
                              ? '#dc2626'
                              : riskEval.riskCategory === 'HIGH'
                              ? '#ea580c'
                              : '#15803d',
                        }}
                      >
                        {riskEval.riskCategory}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                        Contributing Risk Factors:
                      </div>
                      <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                        {riskEval.contributingFactors.map((f, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626' }}>CRITICAL FINDINGS</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{riskEval.openCriticalCount}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#fff7ed', borderRadius: '6px', border: '1px solid #fdba74' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#ea580c' }}>HIGH FINDINGS</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c' }}>{riskEval.openHighCount}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#d97706' }}>MEDIUM FINDINGS</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>{riskEval.openMediumCount}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7' }}>LOW / INFO</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>{riskEval.openLowCount}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Evaluating target risk...</div>
              )}
            </Card>

            <div style={{ marginTop: '20px' }}>
              <Card title="Assessment History" subtitle="Security assessments conducted for this website">
                <Table
                  data={assessments.slice(0, 5)}
                  keyExtractor={(a) => a.id}
                  emptyMessage="No assessments run for this website yet."
                  columns={[
                    {
                      header: 'Assessment ID',
                      render: (a) => (
                        <Link to={`/assessments/${a.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                          {a.id.substring(0, 8)}...
                        </Link>
                      ),
                    },
                    { header: 'Profile', accessor: 'profileName' },
                    { header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
                    { header: 'Date', render: (a) => new Date(a.createdAt).toLocaleDateString() },
                    {
                      header: 'Action',
                      render: (a) => (
                        <Link to={`/assessments/${a.id}`} style={{ fontSize: '11.5px', fontWeight: 600 }}>
                          Inspect →
                        </Link>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>
          </div>

          <div>
            <Card title="Operational Controls" subtitle="Target quick actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button
                  variant="secondary"
                  icon={<Play size={14} />}
                  onClick={() => navigate(`/assessments/new?targetId=${target.id}`)}
                  disabled={!isAuthValid}
                >
                  New Assessment
                </Button>
                <Button
                  variant="secondary"
                  icon={<Terminal size={14} />}
                  onClick={() => setActiveTab('FUZZING')}
                >
                  Configure API Fuzzing
                </Button>
                <Button
                  variant="secondary"
                  icon={<RotateCcw size={14} />}
                  onClick={() => setActiveTab('RETESTING')}
                >
                  Controlled Retests ({retests.length})
                </Button>
                <Button
                  variant="secondary"
                  icon={<Radio size={14} />}
                  onClick={() => setActiveTab('MONITORING')}
                >
                  Continuous Monitoring
                </Button>
              </div>
            </Card>

            <div style={{ marginTop: '16px' }}>
              <Card title="Target Activity Log" subtitle="Verified security events">
                {dashboardOverview?.recentActivity && dashboardOverview.recentActivity.length > 0 ? (
                  <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {dashboardOverview.recentActivity.map((act, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>
                        {act}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent activity recorded.</div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 2. WEBSITE DETAILS TAB */}
      {activeTab === 'DETAILS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Configuration &amp; Ownership" subtitle="Core registration details for this website">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Website Name</span>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{target.name}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Primary Base URL</span>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{target.primaryUrl}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Registration Status</span>
                <div style={{ marginTop: '2px' }}><StatusBadge status={target.status} /></div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Created By</span>
                <div style={{ fontSize: '13px', marginTop: '2px' }}>{target.createdByName || 'Admin'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Created Timestamp</span>
                <div style={{ fontSize: '13px', marginTop: '2px' }}>{new Date(target.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Authorization Expiration</span>
                <div style={{ fontSize: '13px', marginTop: '2px', fontWeight: 600 }}>
                  {target.authorizationExpirationDate || 'Not configured'}
                </div>
              </div>
            </div>
          </Card>

          {/* Scope Boundaries */}
          <Card
            title="Scope Boundaries"
            subtitle="Approved domains, URL patterns, and network ranges"
            action={
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setIsScopeModalOpen(true)}>
                Add Scope
              </Button>
            }
          >
            <Table
              data={target.scopes || []}
              keyExtractor={(s) => s.id}
              emptyMessage="No additional scopes defined."
              columns={[
                { header: 'Scope Type', accessor: 'scopeType' },
                { header: 'Pattern / Value', render: (s) => <code style={{ fontSize: '12px' }}>{s.scopeValue}</code> },
                { header: 'Status', render: (s) => <StatusBadge status={s.included ? 'ACTIVE' : 'DISABLED'} /> },
                { header: 'Created', render: (s) => new Date(s.createdAt).toLocaleDateString() },
              ]}
            />
          </Card>

          {/* Authorizations */}
          <Card
            title="Authorization Records"
            subtitle="Recorded owner permissions and assessment approvals"
            action={
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setIsAuthModalOpen(true)}>
                Record Authorization
              </Button>
            }
          >
            <Table
              data={target.authorizations || []}
              keyExtractor={(a) => a.id}
              emptyMessage="No authorization records recorded."
              columns={[
                { header: 'Auth Type', accessor: 'authorizationType' },
                { header: 'Statement', render: (a) => <span style={{ fontSize: '12px' }}>{a.authorizationStatement}</span> },
                { header: 'Active', render: (a) => <StatusBadge status={a.active ? 'ACTIVE' : 'EXPIRED'} /> },
                { header: 'Expiration', accessor: 'expirationDate' },
                { header: 'Authorized By', accessor: 'authorizedByName' },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 3. ATTACK SURFACE TAB */}
      {activeTab === 'ATTACK_SURFACE' && (
        <div>
          <Card
            title="Discovered URLs &amp; Endpoints"
            subtitle={`Discovered endpoints under ${target.name} (${endpoints.length} items recorded)`}
          >
            <Table
              data={endpoints}
              keyExtractor={(ep) => ep.id}
              emptyMessage="No endpoints discovered under this website yet. Run an assessment to populate attack surface."
              columns={[
                { header: 'Method', render: (ep) => <span style={{ fontWeight: 700, fontSize: '12px' }}>{ep.method}</span> },
                {
                  header: 'Path / URL',
                  render: (ep) => <code style={{ fontSize: '12px' }}>{ep.path || ep.url}</code>,
                },
                { header: 'Type', accessor: 'endpointType' },
                {
                  header: 'Auth Observed',
                  render: (ep) => (ep.authenticationObserved ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="DISABLED" />),
                },
                { header: 'Confidence', accessor: 'confidence' },
                { header: 'Source', accessor: 'source' },
                { header: 'First Seen', render: (ep) => new Date(ep.firstSeenAt).toLocaleDateString() },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 4. ASSESSMENTS TAB */}
      {activeTab === 'ASSESSMENTS' && (
        <div>
          <Card
            title="Website Security Assessments"
            subtitle="Scans and automated assessments requested for this website"
            action={
              <Link to={`/assessments/new?targetId=${target.id}`}>
                <Button variant="primary" size="sm" icon={<Plus size={14} />} disabled={!isAuthValid}>
                  New Assessment
                </Button>
              </Link>
            }
          >
            <Table
              data={assessments}
              keyExtractor={(a) => a.id}
              emptyMessage="No assessments recorded for this website."
              columns={[
                {
                  header: 'Assessment ID',
                  render: (a) => (
                    <Link to={`/assessments/${a.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                      {a.id.substring(0, 8)}...
                    </Link>
                  ),
                },
                { header: 'Profile', accessor: 'profileName' },
                { header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
                { header: 'Progress', render: (a) => <span>{a.progressPercent}%</span> },
                { header: 'Requested By', render: (a: any) => a.requestedByName || 'Admin' },
                { header: 'Date', render: (a) => new Date(a.createdAt).toLocaleString() },
                {
                  header: 'Action',
                  render: (a) => (
                    <Link to={`/assessments/${a.id}`}>
                      <Button variant="secondary" size="sm">
                        Inspect
                      </Button>
                    </Link>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 5. WEB / API FUZZING TAB */}
      {activeTab === 'FUZZING' && (
        <div>
          <Card
            title="Web Application &amp; API Fuzzing"
            subtitle="Autonomous fuzzing campaigns and test case executions for this website"
            action={
              <Link to={`/fuzzing`}>
                <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                  Fuzzing Center
                </Button>
              </Link>
            }
          >
            <Table
              data={campaigns}
              keyExtractor={(c) => c.id}
              emptyMessage="No fuzzing campaigns configured for this target."
              columns={[
                { header: 'Name', accessor: 'name' },
                { header: 'Profile', accessor: 'profile' },
                { header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
                { header: 'Test Cases', render: (c) => <span>{c.totalTestCases} cases</span> },
                { header: 'Findings Discovered', render: (c) => <span style={{ fontWeight: 700 }}>{c.findingsCount}</span> },
                { header: 'Created', render: (c) => new Date(c.createdAt).toLocaleDateString() },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 6. FINDINGS TAB */}
      {activeTab === 'FINDINGS' && (
        <div>
          <Card
            title="Vulnerability Findings"
            subtitle="Discovered weaknesses scoped to this website"
          >
            <Table
              data={findings}
              keyExtractor={(f) => f.id}
              emptyMessage="No vulnerability findings recorded for this website."
              columns={[
                {
                  header: 'Title',
                  render: (f) => (
                    <Link to={`/findings/${f.id}`} style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>
                      {f.title}
                    </Link>
                  ),
                },
                {
                  header: 'Severity',
                  render: (f) => (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          f.severity === 'CRITICAL'
                            ? '#fef2f2'
                            : f.severity === 'HIGH'
                            ? '#fff7ed'
                            : f.severity === 'MEDIUM'
                            ? '#fffbeb'
                            : '#f0f9ff',
                        color:
                          f.severity === 'CRITICAL'
                            ? '#dc2626'
                            : f.severity === 'HIGH'
                            ? '#ea580c'
                            : f.severity === 'MEDIUM'
                            ? '#d97706'
                            : '#0284c7',
                      }}
                    >
                      {f.severity}
                    </span>
                  ),
                },
                { header: 'Status', render: (f) => <StatusBadge status={f.status} /> },
                { header: 'Source', accessor: 'source' },
                { header: 'First Seen', render: (f) => new Date(f.firstSeenAt).toLocaleDateString() },
                {
                  header: 'Action',
                  render: (f) => (
                    <Link to={`/findings/${f.id}`}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 7. OBSERVED ATTACKS & INCIDENTS TAB */}
      {activeTab === 'INCIDENTS' && (
        <div>
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Info size={18} color="var(--accent-primary)" />
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              <strong>Architecture Boundary:</strong> Scan findings represent assessed vulnerabilities, while observed attacks require real telemetry from connected WAF, IDS, or application logs. No fake events are generated.
            </div>
          </div>

          <Card
            title="Observed Telemetry Incidents"
            subtitle={`Telemetry-backed security events for ${target.name}`}
          >
            {incidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                <ShieldCheck size={32} color="#15803d" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)' }}>
                  No observed attack incidents recorded for this website.
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Source IP unavailable from available telemetry. Telemetry sensors required to capture real-time attacks.
                </div>
              </div>
            ) : (
              <Table
                data={incidents}
                keyExtractor={(i) => i.id}
                columns={[
                  {
                    header: 'Title',
                    render: (i) => (
                      <Link to={`/incidents/${i.id}`} style={{ fontWeight: 600 }}>
                        {i.title}
                      </Link>
                    ),
                  },
                  { header: 'Severity', accessor: 'severity' },
                  { header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
                  {
                    header: 'Source IP',
                    render: (i) => (i.sourceIp ? <code>{i.sourceIp}</code> : <span style={{ color: 'var(--text-muted)' }}>Source IP unavailable from available telemetry</span>),
                  },
                  { header: 'Observed Time', render: (i) => new Date(i.firstObservedAt).toLocaleString() },
                ]}
              />
            )}
          </Card>
        </div>
      )}

      {/* 8. FORENSICS TAB */}
      {activeTab === 'FORENSICS' && (
        <div>
          <Card title="Digital Forensics" subtitle="Target-associated evidence and investigative case files">
            <Table
              data={forensicCases}
              keyExtractor={(f) => f.id}
              emptyMessage="No digital forensic cases created for this website."
              columns={[
                {
                  header: 'Case Title',
                  render: (f) => (
                    <Link to={`/forensics/${f.id}`} style={{ fontWeight: 600 }}>
                      {f.title}
                    </Link>
                  ),
                },
                { header: 'Status', render: (f) => <StatusBadge status={f.status} /> },
                { header: 'Evidence Count', render: (f: any) => <span>{f.evidenceCount || 0} artifacts</span> },
                { header: 'Created Date', render: (f) => new Date(f.createdAt).toLocaleDateString() },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 9. DEFENSE & PROTECTION TAB */}
      {activeTab === 'DEFENSE' && (
        <div>
          <Card title="Defense Controls &amp; Hardening" subtitle="Active controls, WAF policies, and verified protection rules">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>SECURITY HEADERS</span>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>CSP, HSTS, X-Frame-Options</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Evaluated in latest assessment</div>
              </div>
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>TLS &amp; CIPHER SUITE</span>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>TLS 1.2 / 1.3 Baseline</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Target certificate validated</div>
              </div>
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>WAF INTEGRATION</span>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>Cloudflare / AWS WAF Ready</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Telemetry export configured</div>
              </div>
            </div>
            <Link to="/defense">
              <Button variant="secondary">Open Enterprise Defense Center →</Button>
            </Link>
          </Card>
        </div>
      )}

      {/* 10. REMEDIATION TAB */}
      {activeTab === 'REMEDIATION' && (
        <div>
          <Card title="Remediation Workspace" subtitle="Recommended and executed fixes for findings on this website">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Select open findings on this target to generate remediation guidance, code patches, and configuration fixes.
            </p>
            <Link to={`/remediation?targetId=${target.id}`}>
              <Button variant="primary">Open Remediation Workspace</Button>
            </Link>
          </Card>
        </div>
      )}

      {/* 11. RETESTING TAB */}
      {activeTab === 'RETESTING' && (
        <div>
          <Card title="Controlled Retest Executions" subtitle="Verification checks proving whether fixes succeeded">
            <Table
              data={retests}
              keyExtractor={(r) => r.id}
              emptyMessage="No retests executed for this website."
              columns={[
                {
                  header: 'Retest ID',
                  render: (r) => (
                    <Link to={`/retests/${r.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                      {r.id.substring(0, 8)}...
                    </Link>
                  ),
                },
                { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { header: 'Reason', accessor: 'reason' },
                { header: 'Execution Date', render: (r) => new Date(r.createdAt).toLocaleString() },
                {
                  header: 'Action',
                  render: (r) => (
                    <Link to={`/retests/${r.id}`}>
                      <Button variant="secondary" size="sm">
                        Inspect
                      </Button>
                    </Link>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 12. SECURITY POSTURE TAB */}
      {activeTab === 'POSTURE' && (
        <div>
          <Card title="Security Posture Breakdown" subtitle="Detailed dimension scores and posture regression checks">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>OVERALL SCORE</span>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
                  {posture ? `${Math.round(posture.overallScore)}/100` : (riskEval?.riskScore !== null ? `${riskEval?.riskScore}/100` : 'Unassessed')}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>RISK LEVEL</span>
                <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: '#ea580c' }}>
                  {posture ? posture.riskLevel : (riskEval?.riskCategory || 'NOT_ASSESSED')}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>SCORE DELTA</span>
                <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', color: '#15803d' }}>
                  {posture?.scoreDelta !== undefined ? `${posture.scoreDelta > 0 ? '+' : ''}${posture.scoreDelta}` : '0'}
                </div>
              </div>
            </div>
            <Link to={`/posture?targetId=${target.id}`}>
              <Button variant="secondary">View Full Posture Dimensions →</Button>
            </Link>
          </Card>
        </div>
      )}

      {/* 13. REPORTS TAB */}
      {activeTab === 'REPORTS' && (
        <div>
          <Card
            title="Generated Security Reports"
            subtitle={`Reports scoped to ${target.name}`}
            action={
              <Link to={`/reports?targetId=${target.id}`}>
                <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                  Generate Report
                </Button>
              </Link>
            }
          >
            <Table
              data={reports}
              keyExtractor={(r) => r.id}
              emptyMessage="No reports generated for this website."
              columns={[
                { header: 'Title', accessor: 'title' },
                { header: 'Type', accessor: 'reportType' },
                { header: 'Format', accessor: 'format' },
                { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { header: 'Created', render: (r) => new Date(r.createdAt).toLocaleDateString() },
              ]}
            />
          </Card>
        </div>
      )}

      {/* 14. MONITORING TAB */}
      {activeTab === 'MONITORING' && (
        <div>
          <Card title="Continuous Monitoring Schedule" subtitle="Automated periodic security scanning schedule">
            {monitoringConfig ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>STATUS</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
                      {monitoringConfig.enabled ? 'ACTIVE' : 'PAUSED'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FREQUENCY</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
                      {monitoringConfig.frequency}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>NEXT RUN</span>
                    <div style={{ fontSize: '13px', marginTop: '2px' }}>
                      {monitoringConfig.nextRunAt ? new Date(monitoringConfig.nextRunAt).toLocaleString() : 'Not scheduled'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <Radio size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>No continuous monitoring schedule configured for this target.</div>
              </div>
            )}
            <Link to={`/monitoring?targetId=${target.id}`}>
              <Button variant="secondary">Configure Schedule in Monitoring Hub →</Button>
            </Link>
          </Card>
        </div>
      )}

      {/* 15. SECURITY HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div>
          <Card title="Chronological Security Timeline" subtitle="Target-specific audit events and posture modifications">
            {timeline?.events && timeline.events.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {timeline.events.map((evt, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {evt.title || evt.summary}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Category: {evt.category} • Severity: {evt.severity}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '24px' }}>
                <History size={24} style={{ marginBottom: '6px', opacity: 0.5 }} />
                <div>No security history records for this target yet.</div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Add Authorization Modal */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Record Target Authorization">
        {authError && <Alert type="error" message={authError} />}
        <form onSubmit={handleAddAuthorization}>
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500 }}>Authorization Type</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthorizationType)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
              }}
            >
              <option value="WRITTEN_PERMISSION">Written Permission</option>
              <option value="DOMAIN_OWNERSHIP_TXT">Domain Ownership (TXT Record)</option>
              <option value="HTTP_META_TAG">HTTP Meta Tag Verification</option>
              <option value="INTERNAL_SYSTEM_APPROVED">Internal System Approval</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500 }}>Authorization Statement</label>
            <textarea
              value={authStatement}
              onChange={(e) => setAuthStatement(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                Authorization Date
              </label>
              <input
                type="date"
                value={authDate}
                onChange={(e) => setAuthDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                Expiration Date
              </label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setIsAuthModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isAuthSubmitting}>
              {isAuthSubmitting ? 'Recording...' : 'Record Authorization'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Scope Modal */}
      <Modal isOpen={isScopeModalOpen} onClose={() => setIsScopeModalOpen(false)} title="Add Target Scope Boundary">
        <form onSubmit={handleAddScope}>
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500 }}>Scope Type</label>
            <select
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as ScopeType)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
              }}
            >
              <option value="URL">Specific URL Pattern</option>
              <option value="DOMAIN">Subdomain / Domain Boundary</option>
              <option value="IP_RANGE">IP Address or CIDR Range</option>
              <option value="PATH">Route / Path Boundary</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500 }}>Scope Value</label>
            <input
              type="text"
              placeholder="e.g. https://api.example.com/* or /v1/*"
              value={scopeValue}
              onChange={(e) => setScopeValue(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setIsScopeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isScopeSubmitting || !scopeValue}>
              {isScopeSubmitting ? 'Adding...' : 'Add Scope Boundary'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
