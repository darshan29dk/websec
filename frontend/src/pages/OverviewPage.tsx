import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api/dashboardApi';
import { targetApi } from '../services/api/targetApi';
import { GlobalDashboardOverview, GlobalDashboardCharts } from '../types/dashboard';
import { Target, TargetStatus } from '../types/target';
import { PageResponse } from '../types/common';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { BulkImportModal } from '../components/BulkImportModal';
import {
  Globe,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Upload,
  ArrowRight,
  Activity,
  Radio,
  BarChart2,
  Lock,
  Layers,
  Search,
  CheckCircle2,
  RotateCcw,
  Clock,
  HelpCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();

  // Dashboard Aggregates & Charts
  const [overview, setOverview] = useState<GlobalDashboardOverview | null>(null);
  const [charts, setCharts] = useState<GlobalDashboardCharts | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Targets List state
  const [targetPage, setTargetPage] = useState<PageResponse<Target> | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [isTargetsLoading, setIsTargetsLoading] = useState(true);

  // Bulk Import Modal
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsDashboardLoading(true);
    try {
      const [overviewData, chartsData] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getCharts(),
      ]);
      setOverview(overviewData);
      setCharts(chartsData);
    } catch (err) {
      console.error('Failed to load global dashboard aggregates', err);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const fetchTargets = async () => {
    setIsTargetsLoading(true);
    try {
      const data = await targetApi.getTargets(
        page,
        15,
        statusFilter ? (statusFilter as TargetStatus) : undefined,
        search || undefined
      );
      setTargetPage(data);
    } catch (err) {
      console.error('Failed to fetch targets', err);
    } finally {
      setIsTargetsLoading(false);
    }
  };

  const setIsDashboardLoading = (val: boolean) => setIsLoadingDashboard(val);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchTargets();
  };

  const handleRefreshAll = () => {
    fetchDashboardData();
    fetchTargets();
  };

  // Filter targets locally by risk category if specified
  const filteredTargets = (targetPage?.content || []).filter((t) => {
    if (riskFilter === 'ALL') return true;
    const chartMatch = charts?.highestRiskWebsites?.find((h) => h.targetId === t.id);
    if (!chartMatch) {
      return riskFilter === 'NOT_ASSESSED';
    }
    return chartMatch.riskCategory === riskFilter;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header & Platform Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                color: 'var(--accent-primary)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              Enterprise Defense Hub
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• 10 Security Phases Online</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '4px' }}>
            Global Security Dashboard
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Aggregated vulnerability posture, attack surface discovery, and verified telemetry across all registered websites
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} className={isLoadingDashboard ? 'spin' : ''} />}
            onClick={handleRefreshAll}
          >
            Refresh Data
          </Button>

          <Button
            variant="secondary"
            icon={<Upload size={15} />}
            onClick={() => setIsBulkImportOpen(true)}
          >
            Bulk Import Websites
          </Button>

          <Link to="/targets/new">
            <Button variant="primary" icon={<Plus size={15} />}>
              Add Website
            </Button>
          </Link>
        </div>
      </div>

      {/* SECTION 4.1: GLOBAL SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {/* Total Registered Websites */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderTop: '3px solid var(--accent-primary)',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Websites
            </span>
            <Globe size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '8px', lineHeight: 1 }}>
            {overview ? overview.totalWebsites : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {overview ? `${overview.totalDiscoveredEndpoints} discovered endpoints` : 'Loading websites...'}
          </div>
        </div>

        {/* Website Risk Breakdown (Critical & High) */}
        <div
          onClick={() => setRiskFilter(riskFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderTop: '3px solid #dc2626',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fca5a5')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Critical Risk
            </span>
            <ShieldAlert size={16} color="#dc2626" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', marginTop: '8px', lineHeight: 1 }}>
            {overview ? overview.criticalRiskWebsites : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {overview ? `${overview.highRiskWebsites} High Risk websites` : 'Evaluating...'}
          </div>
        </div>

        {/* Medium & Low Risk Websites */}
        <div
          onClick={() => setRiskFilter(riskFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderTop: '3px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fde68a')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Medium / Low
            </span>
            <AlertTriangle size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '8px', lineHeight: 1 }}>
            {overview ? overview.mediumRiskWebsites + overview.lowRiskWebsites : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {overview ? `${overview.lowRiskWebsites} evaluated low risk` : 'Calculating...'}
          </div>
        </div>

        {/* Unassessed Websites */}
        <div
          onClick={() => setRiskFilter(riskFilter === 'NOT_ASSESSED' ? 'ALL' : 'NOT_ASSESSED')}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderTop: '3px solid #64748b',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Unassessed
            </span>
            <HelpCircle size={16} color="#64748b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#64748b', marginTop: '8px', lineHeight: 1 }}>
            {overview ? overview.unassessedWebsites : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Pending security assessment
          </div>
        </div>

        {/* Unique Open Findings */}
        <div
          onClick={() => navigate('/findings')}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderTop: '3px solid #ea580c',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#fdba74')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Open Findings
            </span>
            <Lock size={16} color="#ea580c" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ea580c', marginTop: '8px', lineHeight: 1 }}>
            {overview ? overview.totalUniqueOpenFindings : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {overview ? `${overview.criticalOpenFindings} Crit • ${overview.highOpenFindings} High` : '—'}
          </div>
        </div>

        {/* Verified Fixes & Retests */}
        <div
          onClick={() => navigate('/retests')}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderTop: '3px solid #15803d',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#86efac')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Verified Fixes
            </span>
            <CheckCircle2 size={16} color="#15803d" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d', marginTop: '8px', lineHeight: 1 }}>
            {overview ? overview.verifiedFixes : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {overview ? `${overview.findingsResolved} findings resolved` : '—'}
          </div>
        </div>
      </div>

      {/* Posture Bar & Operational Status Indicator */}
      {overview && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Overall Posture:
              </span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color:
                    overview.overallPostureScore === null
                      ? '#64748b'
                      : overview.overallPostureScore >= 80
                      ? '#15803d'
                      : overview.overallPostureScore >= 60
                      ? '#b45309'
                      : '#dc2626',
                }}
              >
                {overview.overallPostureScore !== null ? `${overview.overallPostureScore}/100` : 'Unassessed'}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor:
                    overview.overallPostureStatus === 'STRONG'
                      ? '#ecfdf5'
                      : overview.overallPostureStatus === 'WARNING'
                      ? '#fffbeb'
                      : overview.overallPostureStatus === 'AT_RISK'
                      ? '#fef2f2'
                      : '#f1f5f9',
                  color:
                    overview.overallPostureStatus === 'STRONG'
                      ? '#047857'
                      : overview.overallPostureStatus === 'WARNING'
                      ? '#b45309'
                      : overview.overallPostureStatus === 'AT_RISK'
                      ? '#b91c1c'
                      : '#64748b',
                }}
              >
                {overview.overallPostureStatus}
              </span>
            </div>

            <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-color)' }} />

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={14} color={overview.monitoringActiveCount > 0 ? '#15803d' : '#64748b'} />
              <span>
                Continuous Monitoring: <strong>{overview.monitoringCoveragePercent}% coverage</strong> ({overview.monitoringActiveCount} active schedules)
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'right' }}>
            {overview.telemetryStatusMessage}
          </div>
        </div>
      )}

      {/* SECTION 4.2: GLOBAL CHARTS */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <BarChart2 size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            Security Intelligence &amp; Risk Metrics
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            (Live backend-calculated data sets)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {/* Chart 1: Website Risk Distribution */}
          <Card title="Website Risk Distribution" subtitle="Risk classification across registered websites">
            {charts?.riskDistribution ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
                {charts.riskDistribution.map((item) => {
                  const colors: Record<string, string> = {
                    CRITICAL: '#dc2626',
                    HIGH: '#ea580c',
                    MEDIUM: '#d97706',
                    LOW: '#15803d',
                    NOT_ASSESSED: '#64748b',
                  };
                  const color = colors[item.category] || '#64748b';
                  return (
                    <div key={item.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.category}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {item.count} websites ({item.percentage}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%`,
                            height: '100%',
                            backgroundColor: color,
                            borderRadius: '4px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '16px 0' }}>Loading distribution...</div>
            )}
          </Card>

          {/* Chart 2: Open Findings by Severity */}
          <Card title="Open Findings by Severity" subtitle="Unique unresolved vulnerabilities">
            {charts?.findingsBySeverity ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
                {charts.findingsBySeverity.map((item) => {
                  const total = charts.findingsBySeverity.reduce((acc, c) => acc + c.count, 0);
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  const colors: Record<string, string> = {
                    CRITICAL: '#dc2626',
                    HIGH: '#ea580c',
                    MEDIUM: '#d97706',
                    LOW: '#0284c7',
                  };
                  return (
                    <div key={item.severity}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.severity}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{item.count}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.max(pct, item.count > 0 ? 6 : 0)}%`,
                            height: '100%',
                            backgroundColor: colors[item.severity] || '#64748b',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '16px 0' }}>Loading severities...</div>
            )}
          </Card>

          {/* Chart 3: Highest-Risk Websites */}
          <Card title="Highest-Risk Websites" subtitle="Priority targets requiring attention">
            {charts?.highestRiskWebsites && charts.highestRiskWebsites.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {charts.highestRiskWebsites.map((web) => (
                  <div
                    key={web.targetId}
                    onClick={() => navigate(`/targets/${web.targetId}`)}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {web.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {web.primaryUrl}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: web.riskCategory === 'CRITICAL' ? '#fef2f2' : '#fff7ed',
                          color: web.riskCategory === 'CRITICAL' ? '#b91c1c' : '#c2410c',
                        }}
                      >
                        {web.riskCategory}
                      </span>
                      {web.openCriticalFindings > 0 && (
                        <div style={{ fontSize: '9.5px', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
                          {web.openCriticalFindings} Crit
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
                <ShieldCheck size={28} color="#15803d" style={{ marginBottom: '6px' }} />
                <div>No critical risk websites identified.</div>
              </div>
            )}
          </Card>

          {/* Chart 4: Retest & Remediation Outcomes */}
          <Card title="Remediation &amp; Retesting" subtitle="Outcome of verified security fixes">
            {charts?.remediationRetestOutcomes && charts.remediationRetestOutcomes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
                {charts.remediationRetestOutcomes.map((item) => (
                  <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {item.status}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.status === 'VERIFIED_FIXED' ? '#ecfdf5' : '#f8fafc',
                        color: item.status === 'VERIFIED_FIXED' ? '#047857' : 'var(--text-heading)',
                      }}
                    >
                      {item.count} execution(s)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>
                <RotateCcw size={24} style={{ marginBottom: '6px', opacity: 0.5 }} />
                <div>No retest executions conducted yet.</div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* SECTION 4.3: DEDICATED WEBSITES / TARGETS LIST */}
      <Card
        title="Registered Website Targets"
        subtitle="1 Website = 1 Target. Contains discovered endpoints, routes, API boundaries, and real risk scores"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={14} />}
              onClick={() => setIsBulkImportOpen(true)}
            >
              Bulk Import
            </Button>
            <Link to="/targets/new">
              <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                Add Website
              </Button>
            </Link>
          </div>
        }
      >
        {/* Search, Risk & Status Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Search website name or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <Button type="submit" variant="secondary" icon={<Search size={14} />}>
              Search
            </Button>
          </form>

          {/* Risk Level Filter */}
          <div style={{ width: '180px' }}>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
              <option value="NOT_ASSESSED">Not Assessed</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISABLED">DISABLED</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
        </div>

        {/* Website Target Inventory Table */}
        <Table
          data={filteredTargets}
          keyExtractor={(t) => t.id}
          isLoading={isTargetsLoading}
          emptyMessage="No website targets match current search or filters."
          columns={[
            {
              header: 'Website Name & URL',
              render: (t) => (
                <div>
                  <Link
                    to={`/targets/${t.id}`}
                    style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', display: 'block' }}
                  >
                    {t.name}
                  </Link>
                  <a
                    href={t.primaryUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px',
                    }}
                  >
                    {t.primaryUrl} <ExternalLink size={10} />
                  </a>
                </div>
              ),
            },
            {
              header: 'Authorization',
              render: (t) => <StatusBadge status={t.authorized ? 'ACTIVE' : 'EXPIRED'} />,
            },
            {
              header: 'Risk Classification',
              render: (t) => {
                const match = charts?.highestRiskWebsites?.find((h) => h.targetId === t.id);
                if (!match || match.riskCategory === 'NOT_ASSESSED') {
                  return (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                      }}
                    >
                      Not Assessed
                    </span>
                  );
                }
                const isCrit = match.riskCategory === 'CRITICAL';
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isCrit ? '#fef2f2' : match.riskCategory === 'HIGH' ? '#fff7ed' : '#ecfdf5',
                        color: isCrit ? '#dc2626' : match.riskCategory === 'HIGH' ? '#ea580c' : '#15803d',
                      }}
                    >
                      {match.riskCategory}
                    </span>
                    {isCrit && match.openCriticalFindings > 0 && (
                      <span title="Critical finding override applied" style={{ display: 'flex', alignItems: 'center' }}>
                        <ShieldAlert size={14} color="#dc2626" />
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              header: 'Endpoints',
              render: (t) => (
                <span style={{ fontSize: '12px', fontWeight: 600 }}>
                  {t.scopes?.length || 1} defined
                </span>
              ),
            },
            {
              header: 'Status',
              render: (t) => <StatusBadge status={t.status} />,
            },
            {
              header: 'Created Date',
              render: (t) => (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              ),
            },
            {
              header: 'Actions',
              render: (t) => (
                <Link to={`/targets/${t.id}`}>
                  <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                    Open Dashboard
                  </Button>
                </Link>
              ),
            },
          ]}
        />

        {/* Pagination */}
        {targetPage && targetPage.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredTargets.length} of {targetPage.totalElements} website targets
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= targetPage.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Bulk Import Modal Component */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
          fetchTargets();
        }}
      />
    </div>
  );
};
