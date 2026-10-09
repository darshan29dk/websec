import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fuzzingApi } from '../services/api/fuzzingApi';
import { targetApi } from '../services/api/targetApi';
import { Target } from '../types/target';
import {
  FuzzingCampaign,
  FuzzingTestCase,
  FuzzingExecutionRecord,
  FuzzingCoverageResult,
  FuzzingProfile,
  CreateFuzzingCampaignRequest,
  ReproduceTestCaseResponse,
  TestResultClassification,
} from '../types/fuzzing';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import {
  ShieldAlert,
  Play,
  XCircle,
  RefreshCw,
  Plus,
  Terminal,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  ShieldCheck,
  Lock,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';

export const FuzzingWorkspacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTargetId = searchParams.get('targetId') || '';

  // State
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(initialTargetId);
  const [campaigns, setCampaigns] = useState<FuzzingCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [campaign, setCampaign] = useState<FuzzingCampaign | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'EXECUTIONS' | 'INSPECTOR' | 'COVERAGE' | 'SEQUENCES' | 'TEST_CASES'>('EXECUTIONS');

  // Data
  const [executions, setExecutions] = useState<FuzzingExecutionRecord[]>([]);
  const [testCases, setTestCases] = useState<FuzzingTestCase[]>([]);
  const [coverage, setCoverage] = useState<FuzzingCoverageResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filter
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState<boolean>(false);
  const [selectedExecution, setSelectedExecution] = useState<FuzzingExecutionRecord | null>(null);
  const [reproduceResult, setReproduceResult] = useState<ReproduceTestCaseResponse | null>(null);
  const [isReproducing, setIsReproducing] = useState<boolean>(false);
  const [isRemediationModalOpen, setIsRemediationModalOpen] = useState<boolean>(false);
  const [remediationFindingId, setRemediationFindingId] = useState<string>('');
  const [remediationTitle, setRemediationTitle] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [actionErrorMsg, setActionErrorMsg] = useState<string>('');

  // New Campaign Form State
  const [newCampaignForm, setNewCampaignForm] = useState<CreateFuzzingCampaignRequest>({
    targetId: '',
    name: '',
    profile: 'SAFE_ACTIVE_FUZZ',
    rateLimitRps: 5,
    maxRequests: 50,
    timeoutMs: 10000,
    concurrency: 1,
    categories: ['A01', 'A03', 'A05', 'A07', 'A10'],
    enableMultiStepSequences: true,
  });

  // Load Targets on mount
  useEffect(() => {
    const loadTargets = async () => {
      try {
        const resp = await targetApi.getTargets(0, 100);
        if (resp && resp.content) {
          setTargets(resp.content);
          if (!selectedTargetId && resp.content.length > 0) {
            setSelectedTargetId(resp.content[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load targets', err);
      }
    };
    loadTargets();
  }, []);

  // Load campaigns when selectedTargetId changes
  useEffect(() => {
    if (!selectedTargetId) return;
    loadCampaignsForTarget(selectedTargetId);
  }, [selectedTargetId]);

  const loadCampaignsForTarget = async (tId: string) => {
    setIsLoading(true);
    try {
      const data = await fuzzingApi.getCampaigns(tId);
      setCampaigns(data);
      if (data.length > 0) {
        setSelectedCampaignId(data[0].id);
      } else {
        setSelectedCampaignId('');
        setCampaign(null);
        setExecutions([]);
        setTestCases([]);
        setCoverage([]);
      }
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load campaign details, executions, and coverage
  useEffect(() => {
    if (!selectedCampaignId) return;
    loadCampaignDetails(selectedCampaignId);

    // If campaign is RUNNING, auto-poll every 3 seconds
    const interval = setInterval(() => {
      if (campaign?.status === 'RUNNING') {
        loadCampaignDetails(selectedCampaignId, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedCampaignId, campaign?.status]);

  const loadCampaignDetails = async (cId: string, background = false) => {
    if (!background) setIsRefreshing(true);
    try {
      const [cData, execResp, tcResp, covData] = await Promise.all([
        fuzzingApi.getCampaignById(cId),
        fuzzingApi.getExecutionRecords(cId, undefined, 0, 100),
        fuzzingApi.getTestCases(cId, 0, 100),
        fuzzingApi.getCoverage(cId),
      ]);
      setCampaign(cData);
      if (execResp && execResp.content) setExecutions(execResp.content);
      if (tcResp && tcResp.content) setTestCases(tcResp.content);
      setCoverage(covData);
    } catch (err) {
      console.error('Failed to fetch campaign details', err);
    } finally {
      if (!background) setIsRefreshing(false);
    }
  };

  // Target object helper
  const selectedTarget = useMemo(() => {
    return targets.find((t) => t.id === selectedTargetId);
  }, [targets, selectedTargetId]);

  // Target authorization validity
  const targetAuthStatus = useMemo(() => {
    if (!selectedTarget) return { valid: false, text: 'No Target Selected' };
    if (!selectedTarget.authorizations || selectedTarget.authorizations.length === 0) {
      return { valid: false, text: 'No Authorization Record' };
    }
    const now = new Date();
    const validAuth = selectedTarget.authorizations.find((a) => {
      const exp = a.expirationDate ? new Date(a.expirationDate) : null;
      return !exp || exp >= now;
    });
    if (validAuth) {
      return { valid: true, text: `Authorized (${validAuth.authorizationType})` };
    }
    return { valid: false, text: 'Authorization Expired' };
  }, [selectedTarget]);

  // Filtered executions
  const filteredExecutions = useMemo(() => {
    return executions.filter((e) => {
      const matchClass = classificationFilter === 'ALL' || e.resultClassification === classificationFilter;
      const matchSearch =
        !searchQuery ||
        e.requestUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.parameterName && e.parameterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.testCaseName && e.testCaseName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchClass && matchSearch;
    });
  }, [executions, classificationFilter, searchQuery]);

  // Actions
  const handleStartCampaign = async () => {
    if (!campaign) return;
    try {
      setActionErrorMsg('');
      await fuzzingApi.startCampaign(campaign.id);
      setActionSuccessMsg('Fuzzing campaign execution initiated.');
      loadCampaignDetails(campaign.id);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to start campaign');
    }
  };

  const handleCancelCampaign = async () => {
    if (!campaign) return;
    try {
      setActionErrorMsg('');
      await fuzzingApi.cancelCampaign(campaign.id);
      setActionSuccessMsg('Fuzzing campaign cancelled.');
      loadCampaignDetails(campaign.id);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to cancel campaign');
    }
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      setActionErrorMsg('Please select a target first');
      return;
    }
    try {
      setActionErrorMsg('');
      const payload: CreateFuzzingCampaignRequest = {
        ...newCampaignForm,
        targetId: selectedTargetId,
        name: newCampaignForm.name || `Fuzzing Campaign - ${selectedTarget?.name} - ${new Date().toLocaleTimeString()}`,
      };
      const created = await fuzzingApi.createCampaign(payload);
      setIsNewCampaignModalOpen(false);
      setActionSuccessMsg('Campaign created with ' + created.totalTestCases + ' test cases.');
      await loadCampaignsForTarget(selectedTargetId);
      setSelectedCampaignId(created.id);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to create campaign');
    }
  };

  const handleReproduce = async (testCaseId: string) => {
    setIsReproducing(true);
    setReproduceResult(null);
    try {
      const res = await fuzzingApi.reproduceTestCase({ testCaseId });
      setReproduceResult(res);
    } catch (err: any) {
      console.error('Reproduction failed', err);
    } finally {
      setIsReproducing(false);
    }
  };

  const handleCreateRemediationPlan = async () => {
    if (!remediationFindingId) return;
    try {
      await fuzzingApi.linkFinding({
        findingId: remediationFindingId,
        createRemediationPlan: true,
        remediationPlanTitle: remediationTitle || 'Remediation for Fuzzed Vulnerability',
      });
      setIsRemediationModalOpen(false);
      setActionSuccessMsg('Remediation plan created successfully in Defense Center.');
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to create remediation plan');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              Autonomous Web Application Fuzzing
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              Phase 2 Assessment Capability
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
            Bounded parameter mutation, differential baseline analysis, session multi-step sequences, and OWASP Top 10 coverage verification.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="outline"
            onClick={() => selectedCampaignId && loadCampaignDetails(selectedCampaignId)}
            disabled={isRefreshing || !selectedCampaignId}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setNewCampaignForm((prev) => ({
                ...prev,
                targetId: selectedTargetId,
                name: `Web Fuzzing - ${selectedTarget?.name || 'Target'} - ${new Date().toLocaleDateString()}`,
              }));
              setIsNewCampaignModalOpen(true);
            }}
            disabled={!targetAuthStatus.valid}
          >
            <Plus size={14} style={{ marginRight: '6px' }} />
            New Campaign
          </Button>
        </div>
      </div>

      {actionSuccessMsg && (
        <Alert type="success" title="Success" message={actionSuccessMsg} />
      )}

      {actionErrorMsg && (
        <Alert type="error" title="Action Error" message={actionErrorMsg} />
      )}

      {/* Target & Scope Control Card */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
          {/* Target Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Select Authorized Target
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.primaryUrl})
                </option>
              ))}
            </select>
          </div>

          {/* Authorization & Scope Boundary */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Target Authorization Status
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: targetAuthStatus.valid ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: targetAuthStatus.valid ? '#22c55e' : '#ef4444',
                  border: `1px solid ${targetAuthStatus.valid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                {targetAuthStatus.valid ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                {targetAuthStatus.text}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Scope: {selectedTarget?.primaryUrl || 'N/A'}
              </span>
            </div>
          </div>

          {/* Campaign Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Select Fuzzing Campaign
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                disabled={campaigns.length === 0}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                {campaigns.length === 0 ? (
                  <option value="">No campaigns recorded for target</option>
                ) : (
                  campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} [{c.status}]
                    </option>
                  ))
                )}
              </select>

              {campaign && (
                <>
                  {campaign.status !== 'RUNNING' && campaign.status !== 'COMPLETED' && (
                    <Button variant="primary" size="sm" onClick={handleStartCampaign}>
                      <Play size={14} style={{ marginRight: '4px' }} />
                      Start
                    </Button>
                  )}
                  {campaign.status === 'RUNNING' && (
                    <Button variant="danger" size="sm" onClick={handleCancelCampaign}>
                      <XCircle size={14} style={{ marginRight: '4px' }} />
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Campaign Metrics & Progress Bar */}
      {campaign && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          <Card>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Execution State</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusBadge status={campaign.status} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{campaign.profile}</span>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Progress & Execution</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)' }}>
              {campaign.executedTestCases} / {campaign.totalTestCases}{' '}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({campaign.progressPercent}%)
              </span>
            </div>
            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                marginTop: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${campaign.progressPercent}%`,
                  height: '100%',
                  backgroundColor: campaign.status === 'COMPLETED' ? '#22c55e' : '#3b82f6',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Confirmed Findings</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: campaign.findingsCount > 0 ? '#ef4444' : '#22c55e' }}>
              {campaign.findingsCount}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Suspicious Responses</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: campaign.suspiciousCount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
              {campaign.suspiciousCount}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Rate & Guardrails</div>
            <div style={{ fontSize: '12px', color: 'var(--text-color)' }}>
              <div>Rate: <strong>{campaign.rateLimitRps} RPS</strong></div>
              <div>Cap: <strong>{campaign.maxRequests} req max</strong></div>
              <div>Timeout: <strong>{campaign.timeoutMs}ms</strong></div>
            </div>
          </Card>
        </div>
      )}

      {/* Workspace Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          gap: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('EXECUTIONS')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'EXECUTIONS' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'EXECUTIONS' ? 'var(--text-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'EXECUTIONS' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={15} />
          Executions & Findings ({executions.length})
        </button>

        <button
          onClick={() => setActiveTab('COVERAGE')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'COVERAGE' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'COVERAGE' ? 'var(--text-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'COVERAGE' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={15} />
          OWASP Top 10 Coverage
        </button>

        <button
          onClick={() => setActiveTab('SEQUENCES')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'SEQUENCES' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'SEQUENCES' ? 'var(--text-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'SEQUENCES' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Layers size={15} />
          Multi-Step Sequences
        </button>

        <button
          onClick={() => setActiveTab('TEST_CASES')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'TEST_CASES' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'TEST_CASES' ? 'var(--text-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'TEST_CASES' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Terminal size={15} />
          Generated Test Cases ({testCases.length})
        </button>
      </div>

      {/* Tab 1: Executions & Findings Table */}
      {activeTab === 'EXECUTIONS' && (
        <Card>
          {/* Filters Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '16px',
            }}
          >
            {/* Status Classification Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['ALL', 'VULNERABILITY_CONFIRMED', 'SUSPICIOUS', 'PASSED', 'ERROR', 'BLOCKED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setClassificationFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: classificationFilter === st ? 'var(--accent-primary)' : 'var(--border-color)',
                    backgroundColor: classificationFilter === st ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: classificationFilter === st ? '#60a5fa' : 'var(--text-muted)',
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder="Search endpoint or parameter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 32px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-color)',
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <Table<FuzzingExecutionRecord>
            data={filteredExecutions}
            keyExtractor={(item) => item.id}
            emptyMessage={
              campaign?.status === 'RUNNING'
                ? 'Test execution in progress... Executing bounded requests.'
                : 'No execution records match the current filter criteria.'
            }
            columns={[
              {
                header: 'Classification',
                render: (exec) => (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        exec.resultClassification === 'VULNERABILITY_CONFIRMED'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : exec.resultClassification === 'SUSPICIOUS'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : exec.resultClassification === 'PASSED'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(100, 116, 139, 0.15)',
                      color:
                        exec.resultClassification === 'VULNERABILITY_CONFIRMED'
                          ? '#ef4444'
                          : exec.resultClassification === 'SUSPICIOUS'
                          ? '#f59e0b'
                          : exec.resultClassification === 'PASSED'
                          ? '#22c55e'
                          : '#94a3b8',
                    }}
                  >
                    {exec.resultClassification}
                  </span>
                ),
              },
              {
                header: 'Category',
                render: (exec) => <span style={{ fontSize: '12px' }}>{exec.category || 'N/A'}</span>,
              },
              {
                header: 'HTTP Method & URL',
                render: (exec) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>{exec.requestMethod}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{exec.requestUrl}</span>
                  </div>
                ),
              },
              {
                header: 'Parameter',
                render: (exec) => <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{exec.parameterName || '-'}</span>,
              },
              {
                header: 'Response',
                render: (exec) => (
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{exec.responseStatus || '-'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      ({exec.responseTimeMs}ms)
                    </span>
                  </div>
                ),
              },
              {
                header: 'Diff Summary',
                render: (exec) => (
                  <span style={{ fontSize: '12px', maxWidth: '300px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exec.baselineDiffSummary || '-'}
                  </span>
                ),
              },
              {
                header: 'Actions',
                render: (exec) => (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedExecution(exec);
                        setReproduceResult(null);
                      }}
                    >
                      Inspect
                    </Button>
                    {exec.findingId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setRemediationFindingId(exec.findingId!);
                          setRemediationTitle(`Remediate: ${exec.testCaseName || 'Fuzzing Finding'}`);
                          setIsRemediationModalOpen(true);
                        }}
                      >
                        Remediate
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* Tab 2: OWASP Top 10 Coverage Matrix */}
      {activeTab === 'COVERAGE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <strong>OWASP Coverage Boundary Notice:</strong> GlobalShield enforces honest security reporting. Automated parameter fuzzing validates observable HTTP behavior. Categories requiring design review, configuration analysis, or SBOM inspection are explicitly marked as NOT_SUPPORTED or NOT_CONFIGURED.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {coverage.map((cov) => (
              <Card key={cov.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginRight: '6px' }}>
                      {cov.owaspCategory}
                    </span>
                    <strong style={{ fontSize: '14px' }}>{cov.categoryName}</strong>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        cov.status === 'CONFIRMED'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : cov.status === 'SUSPECTED'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : cov.status === 'PASSED'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(100, 116, 139, 0.15)',
                      color:
                        cov.status === 'CONFIRMED'
                          ? '#ef4444'
                          : cov.status === 'SUSPECTED'
                          ? '#f59e0b'
                          : cov.status === 'PASSED'
                          ? '#22c55e'
                          : '#94a3b8',
                    }}
                  >
                    {cov.status}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Checks executed: <strong>{cov.executedChecksCount}</strong> / <strong>{cov.supportedChecksCount}</strong>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  {cov.limitationsNotes}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Multi-Step Sequences */}
      {activeTab === 'SEQUENCES' && (
        <Card title="Configured Multi-Step Sequences">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Multi-step testing executes sequential requests while capturing session tokens and response variables to test deep authorization and state-dependent logic.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
              }}
            >
              {/* Step 1 */}
              <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>STEP 1</div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0' }}>Session Handshake</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Initiates safe baseline request and captures Set-Cookie or Bearer token header.
                </p>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#22c55e' }}>
                  ✓ Scope Validated
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>STEP 2</div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0' }}>Authenticated Mutation</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Injects bounded fuzzing payload into sensitive parameter using captured session state.
                </p>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#22c55e' }}>
                  ✓ Session Injected
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>STEP 3</div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0' }}>Integrity Verification</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Evaluates target response, verifies absence of privilege escalation or data leakage.
                </p>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#22c55e' }}>
                  ✓ Differential Diff Checked
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: All Generated Test Cases */}
      {activeTab === 'TEST_CASES' && (
          <Table<FuzzingTestCase>
            data={testCases}
            keyExtractor={(tc) => tc.id}
            emptyMessage="No test cases generated for this campaign."
            columns={[
              {
                header: 'Order',
                render: (tc) => <span style={{ fontSize: '12px' }}>#{tc.executionOrder}</span>,
              },
              {
                header: 'Category',
                render: (tc) => <span style={{ fontSize: '12px' }}>{tc.category}</span>,
              },
              {
                header: 'Method',
                render: (tc) => <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>{tc.httpMethod}</span>,
              },
              {
                header: 'URL & Parameter',
                render: (tc) => (
                  <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    {tc.targetUrl}
                    {tc.parameterName && <span style={{ color: 'var(--accent-primary)' }}> [{tc.parameterName}]</span>}
                  </span>
                ),
              },
              {
                header: 'Payload Type',
                render: (tc) => <span style={{ fontSize: '12px' }}>{tc.payloadType}</span>,
              },
              {
                header: 'Status',
                render: (tc) => <StatusBadge status={tc.status} />,
              },
            ]}
          />
      )}

      {/* Execution Inspector Modal */}
      {selectedExecution && (
        <Modal
          isOpen={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
          title={`Test Case Inspector: ${selectedExecution.testCaseName || 'Observation'}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Summary Row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor:
                    selectedExecution.resultClassification === 'VULNERABILITY_CONFIRMED'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(34, 197, 94, 0.15)',
                  color:
                    selectedExecution.resultClassification === 'VULNERABILITY_CONFIRMED' ? '#ef4444' : '#22c55e',
                }}
              >
                {selectedExecution.resultClassification}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Confidence: <strong>{selectedExecution.confidence}</strong>
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Executed: {new Date(selectedExecution.executedAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Split Request & Response */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Request */}
              <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px 0', color: '#38bdf8' }}>
                  HTTP Request (Sanitized)
                </h4>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', marginBottom: '8px' }}>
                  <strong>{selectedExecution.requestMethod}</strong> {selectedExecution.requestUrl}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                  {selectedExecution.requestHeadersSanitized}
                </div>
                {selectedExecution.requestBodySanitized && (
                  <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', color: '#f59e0b' }}>
                    Payload: {selectedExecution.requestBodySanitized}
                  </div>
                )}
              </div>

              {/* Response */}
              <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px 0', color: '#22c55e' }}>
                  HTTP Response ({selectedExecution.responseStatus || '-'})
                </h4>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Response Time: {selectedExecution.responseTimeMs}ms | Hash: {selectedExecution.responseHash?.substring(0, 16)}...
                </div>
                <pre
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    margin: 0,
                    color: 'var(--text-color)',
                  }}
                >
                  {selectedExecution.responseBodySnippet || 'No response body snippet recorded.'}
                </pre>
              </div>
            </div>

            {/* Anomaly & Diff Summary */}
            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <h5 style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 4px 0' }}>Differential Analysis</h5>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                {selectedExecution.baselineDiffSummary || 'No differential anomaly recorded.'}
              </p>
              {selectedExecution.anomalyDetails && (
                <div style={{ fontSize: '12px', color: '#f59e0b' }}>
                  <strong>Anomaly Detail:</strong> {selectedExecution.anomalyDetails}
                </div>
              )}
            </div>

            {/* Reproduction Output if run */}
            {reproduceResult && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: reproduceResult.reproduced ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  border: `1px solid ${reproduceResult.reproduced ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  {reproduceResult.reproduced ? '✓ Condition Successfully Reproduced' : 'Observation Not Reproduced'}
                </div>
                <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-muted)' }}>
                  {reproduceResult.summaryMessage}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button
                variant="outline"
                onClick={() => handleReproduce(selectedExecution.testCaseId)}
                disabled={isReproducing}
              >
                <RotateCcw size={14} className={isReproducing ? 'animate-spin' : ''} style={{ marginRight: '6px' }} />
                {isReproducing ? 'Testing...' : 'Reproduce Test Case Safely'}
              </Button>

              {selectedExecution.findingId && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setRemediationFindingId(selectedExecution.findingId!);
                    setRemediationTitle(`Remediate: ${selectedExecution.testCaseName || 'Fuzzing Finding'}`);
                    setIsRemediationModalOpen(true);
                  }}
                >
                  Create Remediation Plan
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* New Campaign Modal */}
      {isNewCampaignModalOpen && (
        <Modal
          isOpen={isNewCampaignModalOpen}
          onClose={() => setIsNewCampaignModalOpen(false)}
          title="Configure Web Application Fuzzing Campaign"
        >
          <form onSubmit={handleCreateCampaignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Campaign Name
              </label>
              <input
                type="text"
                required
                value={newCampaignForm.name}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Fuzzing Profile
              </label>
              <select
                value={newCampaignForm.profile}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, profile: e.target.value as FuzzingProfile })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <option value="SAFE_ACTIVE_FUZZ">SAFE_ACTIVE_FUZZ (Conservative parameter mutation with non-destructive payloads)</option>
                <option value="PASSIVE_BASELINE">PASSIVE_BASELINE (Baseline inspection & configuration error verification)</option>
                <option value="MULTI_STEP_SEQUENCE">MULTI_STEP_SEQUENCE (Stateful multi-step session sequences)</option>
                <option value="AUTH_SESSION_FUZZ">AUTH_SESSION_FUZZ (Authentication header and forged token boundaries)</option>
              </select>
            </div>

            {/* Guardrails Configuration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Rate Limit ({newCampaignForm.rateLimitRps} RPS)
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={newCampaignForm.rateLimitRps}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, rateLimitRps: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Max Requests ({newCampaignForm.maxRequests})
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={newCampaignForm.maxRequests}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, maxRequests: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Timeout ({newCampaignForm.timeoutMs}ms)
                </label>
                <input
                  type="range"
                  min="2000"
                  max="20000"
                  step="1000"
                  value={newCampaignForm.timeoutMs}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, timeoutMs: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Multi-Step sequences toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="enableMultiStep"
                checked={newCampaignForm.enableMultiStepSequences}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, enableMultiStepSequences: e.target.checked })}
              />
              <label htmlFor="enableMultiStep" style={{ fontSize: '13px', cursor: 'pointer' }}>
                Include Multi-Step Session Handshake Sequences
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="outline" onClick={() => setIsNewCampaignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Generate Campaign
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Remediation Plan Creation Modal */}
      {isRemediationModalOpen && (
        <Modal
          isOpen={isRemediationModalOpen}
          onClose={() => setIsRemediationModalOpen(false)}
          title="Create Remediation Plan in Defense Center"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Links this fuzzing finding directly to Phase 7 Defense Center & Remediation Workspace for tracking, assigning engineering tasks, and running controlled retests.
            </p>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Remediation Plan Title
              </label>
              <input
                type="text"
                value={remediationTitle}
                onChange={(e) => setRemediationTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setIsRemediationModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateRemediationPlan}>
                Create Plan & Open Defense Center
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
