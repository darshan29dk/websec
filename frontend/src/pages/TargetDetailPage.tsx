import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { findingApi } from '../services/api/findingApi';
import { incidentApi } from '../services/api/incidentApi';
import { forensicApi } from '../services/api/forensicApi';
import { postureApi } from '../services/api/postureApi';
import { monitoringApi } from '../services/api/monitoringApi';
import { Target, AuthorizationType, ScopeType } from '../types/target';
import { Assessment } from '../types/assessment';
import { SecurityFinding } from '../types/finding';
import { SecurityIncident } from '../types/incident';
import { ForensicCase } from '../types/forensic';
import { SecurityPostureSnapshotDto } from '../types/posture';
import { MonitoringConfigurationDto } from '../types/monitoring';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Play,
  FileCheck,
  Globe,
  Calendar,
  User as UserIcon,
  Layers,
  Lock,
  AlertTriangle,
  FolderGit2,
  BarChart2,
  RotateCcw,
  FileText,
  Radio,
  History,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { ApiError } from '../types/common';

export const TargetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [target, setTarget] = useState<Target | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [forensicCases, setForensicCases] = useState<ForensicCase[]>([]);
  const [posture, setPosture] = useState<SecurityPostureSnapshotDto | null>(null);
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfigurationDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  // Auth Form
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

  const fetchTargetDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await targetApi.getTargetById(id);
      setTarget(data);

      const [assessRes, findRes, incRes, forRes, postRes, monRes] = await Promise.allSettled([
        assessmentApi.getAssessments(0, 50, id),
        findingApi.getFindings(0, 100, undefined, id),
        incidentApi.getIncidents(0, 50, id),
        forensicApi.getCases({ targetId: id, size: 50 }),
        postureApi.getCurrentPosture(id),
        monitoringApi.getConfigurationByTarget(id),
      ]);

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
      if (postRes.status === 'fulfilled' && postRes.value) {
        setPosture(postRes.value);
      }
      if (monRes.status === 'fulfilled' && monRes.value) {
        setMonitoringConfig(monRes.value);
      }
    } catch {
      setError('Failed to load target details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargetDetails();
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
      fetchTargetDetails();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setAuthError(apiErr.message || 'Failed to add authorization record.');
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
      fetchTargetDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add scope entry.');
    } finally {
      setIsScopeSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading target details...</div>;
  }

  if (error || !target) {
    return (
      <div>
        <Alert type="error" message={error || 'Target not found'} />
        <Button variant="secondary" onClick={() => navigate('/targets')}>
          Back to Targets
        </Button>
      </div>
    );
  }

  const isAuthValid = target.authorized;
  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Backtrack Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/targets');
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
          onClick={() => navigate('/targets')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Targets Inventory
        </button>
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)' }}>
              {target.name}
            </h1>
            <StatusBadge status={target.status} />
          </div>
          <a
            href={target.primaryUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-primary)',
              marginTop: '4px',
              display: 'inline-block',
            }}
          >
            {target.primaryUrl}
          </a>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" icon={<FileCheck size={16} />} onClick={() => setIsAuthModalOpen(true)}>
            Add Authorization
          </Button>

          {isAuthValid && target.status === 'ACTIVE' ? (
            <Link to={`/assessments/new?targetId=${target.id}`}>
              <Button variant="primary" icon={<Play size={16} />}>
                Create Assessment
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              disabled
              icon={<Play size={16} />}
              title="Assessment unavailable: valid authorization is required."
            >
              Create Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Authorization Status Warning Banner if missing */}
      {!isAuthValid && (
        <Alert
          type="warning"
          title="Assessment Unavailable: Target Authorization Required"
          message={
            <div>
              Scanning or creating assessments requires explicit authorization records. Please record owner or written permission.
              <div style={{ marginTop: '8px' }}>
                <Button size="sm" variant="primary" onClick={() => setIsAuthModalOpen(true)}>
                  Add Authorization Record
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* TARGET OVERVIEW CARD (Requirement 3) */}
      <Card title="Target Overview" subtitle="Core authorization, boundaries, and operational posture" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Target Name</span>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px', color: 'var(--text-heading)' }}>{target.name}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Target Type</span>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{target.targetType}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Authorization Status</span>
            <div style={{ marginTop: '4px' }}>
              <StatusBadge status={isAuthValid ? 'ACTIVE' : 'EXPIRED'} />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Authorization Expiration</span>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px', color: isAuthValid ? '#15803d' : '#b91c1c' }}>
              {target.authorizationExpirationDate || 'Not configured'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Scope Boundary</span>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
              {target.scopes?.length || 0} Defined Boundaries
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Created By</span>
            <div style={{ fontSize: '13px', marginTop: '2px' }}>{target.createdByName || 'Security Admin'}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Last Assessment</span>
            <div style={{ fontSize: '13px', marginTop: '2px' }}>
              {latestAssessment ? (
                <Link to={`/assessments/${latestAssessment.id}`} style={{ fontWeight: 600 }}>
                  {latestAssessment.profileName} ({new Date(latestAssessment.createdAt).toLocaleDateString()})
                </Link>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No assessments yet</span>
              )}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Continuous Monitoring</span>
            <div style={{ fontSize: '13px', marginTop: '2px' }}>
              {monitoringConfig ? (
                <span style={{ color: monitoringConfig.enabled ? '#15803d' : '#64748b', fontWeight: 600 }}>
                  {monitoringConfig.enabled ? 'Active (' + monitoringConfig.frequency + ')' : 'Configured (Paused)'}
                </span>
              ) : (
                <Link to={`/monitoring?targetId=${target.id}`} style={{ fontSize: '12px' }}>
                  Enable Monitoring →
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* SECURITY WORK PERFORMED (Requirement 3 - Interactive Navigation Hub) */}
      <Card
        title="Security Work Performed"
        subtitle="Correlated security analysis, detections, investigations, defense, and retests for this target"
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {/* Assessments */}
          <div
            onClick={() => {
              const el = document.getElementById('assessment-history');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Assessments
              </span>
              <Activity size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '6px' }}>
              {assessments.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '2px' }}>
              View Assessment Runs →
            </div>
          </div>

          {/* Findings */}
          <div
            onClick={() => navigate(`/findings?targetId=${target.id}`)}
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fdba74')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Findings
              </span>
              <Lock size={16} color="#ea580c" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ea580c', marginTop: '6px' }}>
              {findings.length}
            </div>
            <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>
              View Findings ({findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} High/Crit) →
            </div>
          </div>

          {/* Incidents */}
          <div
            onClick={() => navigate(`/incidents?targetId=${target.id}`)}
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fca5a5')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Incidents
              </span>
              <AlertTriangle size={16} color="#dc2626" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginTop: '6px' }}>
              {incidents.length}
            </div>
            <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
              View Detections &amp; Incidents →
            </div>
          </div>

          {/* Forensic Cases */}
          <div
            onClick={() => navigate(`/forensics?targetId=${target.id}`)}
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Forensic Cases
              </span>
              <FolderGit2 size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '6px' }}>
              {forensicCases.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '2px' }}>
              Digital Forensic Cases →
            </div>
          </div>

          {/* Security Posture */}
          <div
            onClick={() => navigate(`/posture?targetId=${target.id}`)}
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Security Posture
              </span>
              <BarChart2 size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '6px' }}>
              {posture ? `${Math.round(posture.overallScore)}/100` : 'Evaluated'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '2px' }}>
              Posture Dimensions &amp; Evidence →
            </div>
          </div>

          {/* Defense Controls */}
          <div
            onClick={() => navigate(`/defense?targetId=${target.id}`)}
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Defense Controls
              </span>
              <ShieldCheck size={16} color="#15803d" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '6px' }}>
              Defense Center
            </div>
            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
              Inspect WAF, Headers, TLS →
            </div>
          </div>

          {/* Remediation & Retesting */}
          <div
            onClick={() => navigate(`/retests?targetId=${target.id}`)}
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Controlled Retests
              </span>
              <RotateCcw size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '6px' }}>
              Validation
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '2px' }}>
              Retest Workspaces →
            </div>
          </div>

          {/* Security History */}
          <div
            onClick={() => navigate(`/security-history?targetId=${target.id}`)}
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Security History
              </span>
              <History size={16} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '6px' }}>
              Audit Log
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '2px' }}>
              Chronological Changes →
            </div>
          </div>
        </div>
      </Card>

      {/* Target Scope Section */}
      <Card
        title="Scope Definitions"
        subtitle="Included domains, URLs, IPs, and path boundaries"
        action={
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setIsScopeModalOpen(true)}>
            Add Scope
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          data={target.scopes || []}
          keyExtractor={(s) => s.id}
          emptyMessage="No explicit scopes added yet."
          columns={[
            { header: 'Scope Type', accessor: 'scopeType' },
            {
              header: 'Scope Value',
              render: (s) => <code style={{ fontSize: '12px' }}>{s.scopeValue}</code>,
            },
            {
              header: 'Inclusion',
              render: (s) => (s.included ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="DISABLED" />),
            },
            {
              header: 'Created At',
              render: (s) => new Date(s.createdAt).toLocaleDateString(),
            },
          ]}
        />
      </Card>

      {/* Assessment History Section */}
      <div id="assessment-history">
        <Card title="Assessment History" subtitle="Security assessments requested for this target">
          <Table
            data={assessments}
            keyExtractor={(a) => a.id}
            emptyMessage="No security assessments created for this target yet."
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
              {
                header: 'Status',
                render: (a) => <StatusBadge status={a.status} />,
              },
              { header: 'Requested By', render: (a: any) => a.requestedByName || a.createdBy || 'System' },
              {
                header: 'Created Date',
                render: (a) => new Date(a.createdAt).toLocaleString(),
              },
              {
                header: 'Action',
                render: (a) => (
                  <Link to={`/assessments/${a.id}`} style={{ fontSize: '12px', fontWeight: 600 }}>
                    Inspect Assessment →
                  </Link>
                ),
              },
            ]}
          />
        </Card>
      </div>

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
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            >
              <option value="OWNED_PROPERTY">Owned Property</option>
              <option value="WRITTEN_PERMISSION">Written Permission</option>
              <option value="BUG_BOUNTY_PROGRAM">Bug Bounty Program</option>
              <option value="CLIENT_CONTRACT">Client Contract</option>
              <option value="OTHER">Other Verification</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Input
              label="Authorization Statement / Evidence"
              value={authStatement}
              onChange={(e) => setAuthStatement(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <Input
              label="Authorization Date"
              type="date"
              value={authDate}
              onChange={(e) => setAuthDate(e.target.value)}
              required
            />
            <Input
              label="Expiration Date"
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setIsAuthModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isAuthSubmitting}>
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
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            >
              <option value="DOMAIN">Domain (e.g. *.example.com)</option>
              <option value="URL">URL (e.g. https://example.com/api)</option>
              <option value="IP">IP Address (e.g. 192.168.1.1)</option>
              <option value="CIDR">CIDR Range (e.g. 10.0.0.0/24)</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Input
              label="Scope Value"
              value={scopeValue}
              onChange={(e) => setScopeValue(e.target.value)}
              placeholder="e.g., https://example.com/api or *.example.com"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setIsScopeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isScopeSubmitting}>
              {isScopeSubmitting ? 'Adding...' : 'Add Boundary'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
