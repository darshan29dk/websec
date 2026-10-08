import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../services/api/assessmentApi';
import { findingApi } from '../services/api/findingApi';
import {
  Assessment,
  ToolExecution,
  AssessmentAssetItem,
  AssessmentEndpointItem,
  AssessmentObservationItem,
} from '../types/assessment';
import { SecurityFinding } from '../types/finding';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Ban,
  Terminal,
  Activity,
  Layers,
  Globe,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface StandardToolDefinition {
  name: string;
  purpose: string;
  defaultStage: string;
  minimumProfile: 'PASSIVE' | 'STANDARD_AUTHORIZED' | 'COMPREHENSIVE_AUTHORIZED';
}

const KNOWN_TOOLS: StandardToolDefinition[] = [
  {
    name: 'Nmap',
    purpose: 'Port and service discovery',
    defaultStage: 'PORT_DISCOVERY',
    minimumProfile: 'PASSIVE',
  },
  {
    name: 'WhatWeb',
    purpose: 'Technology fingerprinting',
    defaultStage: 'TECHNOLOGY_DISCOVERY',
    minimumProfile: 'PASSIVE',
  },
  {
    name: 'HttpSecurity',
    purpose: 'HTTP transport & response header security validation',
    defaultStage: 'HTTP_SECURITY_ANALYSIS',
    minimumProfile: 'PASSIVE',
  },
  {
    name: 'Nikto',
    purpose: 'Web server & configuration assessment',
    defaultStage: 'WEB_SERVER_ASSESSMENT',
    minimumProfile: 'STANDARD_AUTHORIZED',
  },
  {
    name: 'Nuclei',
    purpose: 'Approved vulnerability template assessment',
    defaultStage: 'VULNERABILITY_ASSESSMENT',
    minimumProfile: 'STANDARD_AUTHORIZED',
  },
  {
    name: 'OWASP ZAP',
    purpose: 'Controlled web application security analysis',
    defaultStage: 'HTTP_SECURITY_ANALYSIS',
    minimumProfile: 'COMPREHENSIVE_AUTHORIZED',
  },
  {
    name: 'ffuf',
    purpose: 'Controlled directory and endpoint discovery',
    defaultStage: 'HTTP_SECURITY_ANALYSIS',
    minimumProfile: 'COMPREHENSIVE_AUTHORIZED',
  },
  {
    name: 'Amass',
    purpose: 'Subdomain and DNS boundary enumeration',
    defaultStage: 'DNS_DISCOVERY',
    minimumProfile: 'COMPREHENSIVE_AUTHORIZED',
  },
];

export const AssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [assets, setAssets] = useState<AssessmentAssetItem[]>([]);
  const [endpoints, setEndpoints] = useState<AssessmentEndpointItem[]>([]);
  const [observations, setObservations] = useState<AssessmentObservationItem[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected execution for stdout/stderr inspection modal
  const [selectedExecution, setSelectedExecution] = useState<ToolExecution | null>(null);

  const fetchAssessmentData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await assessmentApi.getAssessmentById(id);
      setAssessment(data);

      // Concurrently fetch tools, assets, endpoints, findings
      const [execRes, assetRes, endRes, obsRes, findRes] = await Promise.allSettled([
        assessmentApi.getToolExecutions(id, 0, 50),
        assessmentApi.getAssets(id, 0, 100),
        assessmentApi.getEndpoints(id, 0, 100),
        assessmentApi.getObservations(id, 0, 100),
        findingApi.getFindings(0, 100, id),
      ]);

      if (execRes.status === 'fulfilled' && execRes.value) {
        setExecutions(execRes.value.content || (Array.isArray(execRes.value) ? execRes.value : []));
      }
      if (assetRes.status === 'fulfilled' && assetRes.value) {
        setAssets(assetRes.value.content || (Array.isArray(assetRes.value) ? assetRes.value : []));
      }
      if (endRes.status === 'fulfilled' && endRes.value) {
        setEndpoints(endRes.value.content || (Array.isArray(endRes.value) ? endRes.value : []));
      }
      if (obsRes.status === 'fulfilled' && obsRes.value) {
        setObservations(obsRes.value.content || (Array.isArray(obsRes.value) ? obsRes.value : []));
      }
      if (findRes.status === 'fulfilled' && findRes.value) {
        setFindings(findRes.value.content || (Array.isArray(findRes.value) ? findRes.value : []));
      }
    } catch {
      setError('Failed to load assessment record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentData();
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    if (window.confirm('Cancel this active or queued assessment?')) {
      try {
        await assessmentApi.cancelAssessment(id);
        fetchAssessmentData();
      } catch (err: any) {
        alert(err.message || 'Failed to cancel assessment.');
      }
    }
  };

  if (isLoading) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading assessment details and execution history...</div>;
  }

  if (error || !assessment) {
    return (
      <div>
        <Alert type="error" message={error || 'Assessment not found'} />
        <Button variant="secondary" onClick={() => navigate('/assessments')}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  // Count discoveries per tool name
  const getToolAssetsCount = (toolName: string) =>
    assets.filter((a) => a.source && a.source.toLowerCase().includes(toolName.toLowerCase())).length;

  const getToolEndpointsCount = (toolName: string) =>
    endpoints.filter((e) => e.source && e.source.toLowerCase().includes(toolName.toLowerCase())).length;

  const getToolFindingsCount = (toolName: string) =>
    findings.filter((f) => f.source && f.source.toLowerCase().includes(toolName.toLowerCase())).length;

  // Find tool definition
  const getToolDef = (toolName: string) =>
    KNOWN_TOOLS.find((t) => t.name.toLowerCase() === toolName.toLowerCase()) || {
      name: toolName,
      purpose: 'Target assessment and discovery tool',
      defaultStage: 'PORT_DISCOVERY',
      minimumProfile: 'PASSIVE',
    };

  // Determine un-run tools from profile
  const executedToolNames = new Set(executions.map((e) => e.toolName.toLowerCase()));
  const unrunTools = KNOWN_TOOLS.filter((t) => !executedToolNames.has(t.name.toLowerCase()));

  const formatDuration = (ms?: number) => {
    if (ms === undefined || ms === null) return 'N/A';
    if (ms < 1000) return `${ms} ms`;
    const sec = (ms / 1000).toFixed(1);
    return `${sec} s`;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Backtrack Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/assessments');
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
          onClick={() => navigate('/assessments')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Assessments History
        </button>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)' }}>
              Assessment Execution Record
            </h1>
            <StatusBadge status={assessment.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              ID: {assessment.id}
            </span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
              Target: <Link to={`/targets/${assessment.targetId}`}>{assessment.targetName}</Link>
            </span>
          </div>
        </div>

        {(assessment.status === 'QUEUED' || assessment.status === 'RUNNING') && (
          <Button variant="danger" icon={<Ban size={16} />} onClick={handleCancel}>
            Cancel Assessment
          </Button>
        )}
      </div>

      {/* Assessment Execution Progress */}
      {assessment.status === 'RUNNING' && (
        <Card title="Pipeline Execution Status" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                Active Stage: {assessment.currentStage || 'RUNNING'}
              </span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                {assessment.progressPercent || 0}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--accent-light)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${assessment.progressPercent || 0}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent-primary)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Summary Chips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          onClick={() => navigate(`/attack-surface?assessmentId=${assessment.id}`)}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Discovered Assets
            </span>
            <Globe size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '8px' }}>
            {assets.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px', fontWeight: 600 }}>
            View Host Inventory →
          </div>
        </div>

        <div
          onClick={() => navigate(`/attack-surface?assessmentId=${assessment.id}`)}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Endpoints Observed
            </span>
            <Layers size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '8px' }}>
            {endpoints.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px', fontWeight: 600 }}>
            View Web Endpoints →
          </div>
        </div>

        <div
          onClick={() => navigate(`/findings?assessmentId=${assessment.id}`)}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Security Findings
            </span>
            <Lock size={16} color="#ea580c" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '8px' }}>
            {findings.length}
          </div>
          <div style={{ fontSize: '11px', color: '#ea580c', marginTop: '4px', fontWeight: 600 }}>
            Inspect Vulnerabilities →
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tools Executed
            </span>
            <Terminal size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '8px' }}>
            {executions.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {executions.filter((e) => e.status === 'COMPLETED').length} Successful
          </div>
        </div>
      </div>

      {/* DEDICATED SECTION: Security Tool Execution (Requirement 2) */}
      <Card
        title="Security Tool Execution"
        subtitle="Controlled tool executions, stages, exit codes, and discovery provenance"
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {executions.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No security tool executions have run yet for this assessment record.
            </div>
          ) : (
            executions.map((exec) => {
              const def = getToolDef(exec.toolName);
              const toolAssets = getToolAssetsCount(exec.toolName);
              const toolEndpoints = getToolEndpointsCount(exec.toolName);
              const toolFindings = getToolFindingsCount(exec.toolName);

              return (
                <div
                  key={exec.id}
                  onClick={() => setSelectedExecution(exec)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-focus)';
                    e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: '#f0f9ff',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Terminal size={18} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                            {exec.toolName}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {exec.stage}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Purpose: {def.purpose}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <StatusBadge status={exec.status} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Duration: {formatDuration(exec.durationMs)}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '12px',
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '11.5px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Exit Code: </span>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {exec.exitCode !== undefined ? exec.exitCode : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Assets Discovered: </span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {toolAssets}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Endpoints: </span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {toolEndpoints}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Findings Generated: </span>
                      <span style={{ fontWeight: 600, color: toolFindings > 0 ? '#ea580c' : 'var(--text-heading)' }}>
                        {toolFindings}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        Inspect Output →
                      </span>
                    </div>
                  </div>

                  {/* Error display if failed or unavailable */}
                  {exec.errorMessage && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        color: '#991b1b',
                      }}
                    >
                      <strong>Reason:</strong> {exec.errorMessage}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Section: Configured tools not executed in this profile */}
          {unrunTools.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                Other Configured Platform Tools
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {unrunTools.map((t) => (
                  <div
                    key={t.name}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Purpose: {t.purpose}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        NOT RUN
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Not included in profile
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Assessment Metadata Details */}
      <Card title="Assessment Details" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Name</span>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              <Link to={`/targets/${assessment.targetId}`} style={{ color: 'var(--text-heading)' }}>
                {assessment.targetName}
              </Link>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Primary URL</span>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {assessment.targetPrimaryUrl}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Profile Name</span>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              {assessment.profileName} ({assessment.profileType})
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Requested By</span>
            <div style={{ fontSize: '13px', marginTop: '2px' }}>
              {(assessment as any).requestedByName || (assessment as any).createdBy || 'System'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authorization Confirmation</span>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                marginTop: '2px',
                color: 'var(--status-active-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={16} /> Explicitly Confirmed
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Creation Timestamp</span>
            <div style={{ fontSize: '13px', marginTop: '2px' }}>
              {new Date(assessment.createdAt).toLocaleString()}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Execution Start Time</span>
            <div style={{ fontSize: '13px', marginTop: '2px', color: 'var(--text-muted)' }}>
              {assessment.startedAt ? new Date(assessment.startedAt).toLocaleString() : 'Not started yet'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Execution Completion Time</span>
            <div style={{ fontSize: '13px', marginTop: '2px', color: 'var(--text-muted)' }}>
              {assessment.completedAt ? new Date(assessment.completedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </Card>

      {/* Tool Output Modal */}
      {selectedExecution && (
        <Modal
          isOpen={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
          title={`Tool Execution Output: ${selectedExecution.toolName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Stage: </span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {selectedExecution.stage}
                </span>
              </div>
              <StatusBadge status={selectedExecution.status} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '11.5px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Started At: </span>
                <span>{selectedExecution.startedAt ? new Date(selectedExecution.startedAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Completed At: </span>
                <span>{selectedExecution.completedAt ? new Date(selectedExecution.completedAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Duration: </span>
                <span style={{ fontWeight: 600 }}>{formatDuration(selectedExecution.durationMs)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Exit Code: </span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {selectedExecution.exitCode !== undefined ? selectedExecution.exitCode : 'N/A'}
                </span>
              </div>
            </div>

            {selectedExecution.errorMessage && (
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>Execution Error</span>
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    marginTop: '4px',
                    border: '1px solid #fca5a5',
                  }}
                >
                  {selectedExecution.errorMessage}
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                Standard Output (stdout)
              </span>
              <pre
                style={{
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  overflowX: 'auto',
                  maxHeight: '220px',
                  marginTop: '4px',
                  lineHeight: '1.4',
                }}
              >
                {selectedExecution.stdoutReference || 'No stdout output generated.'}
              </pre>
            </div>

            {selectedExecution.stderrReference && (
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                  Standard Error (stderr)
                </span>
                <pre
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#fca5a5',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    overflowX: 'auto',
                    maxHeight: '160px',
                    marginTop: '4px',
                    lineHeight: '1.4',
                  }}
                >
                  {selectedExecution.stderrReference}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setSelectedExecution(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
