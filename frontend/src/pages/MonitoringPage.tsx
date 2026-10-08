import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Power,
  ShieldCheck,
  Calendar,
  Lock,
  X,
  Target as TargetIcon,
  Check,
  Zap,
} from 'lucide-react';
import { monitoringApi } from '../services/api/monitoringApi';
import { targetApi } from '../services/api/targetApi';
import { SecurityTarget } from '../types/target';
import {
  MonitoringConfigurationDto,
  MonitoringFrequency,
  MonitoringStatus,
} from '../types/monitoring';

export const MonitoringPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const targetIdFilter = searchParams.get('targetId') || '';

  const [configs, setConfigs] = useState<MonitoringConfigurationDto[]>([]);
  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetIdFilter);
  const [frequency, setFrequency] = useState<MonitoringFrequency>('WEEKLY');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadMonitoringData();
    loadTargets();
  }, [statusFilter, targetIdFilter]);

  const loadMonitoringData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.getAllConfigurations();
      let filtered = res;
      if (statusFilter === 'ACTIVE') {
        filtered = filtered.filter((c) => c.enabled);
      }
      if (targetIdFilter) {
        filtered = filtered.filter((c) => c.targetId === targetIdFilter);
      }
      setConfigs(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to load monitoring configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadTargets = async () => {
    try {
      const res = await targetApi.listTargets();
      setTargets(res);
      if (res.length > 0 && !selectedTargetId) {
        setSelectedTargetId(targetIdFilter || res[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;
    setSubmitting(true);
    try {
      await monitoringApi.createConfiguration({
        targetId: selectedTargetId,
        frequency,
      });
      setIsModalOpen(false);
      await loadMonitoringData();
    } catch (err: any) {
      alert('Failed to configure monitoring schedule: ' + (err?.message || 'Check target status.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (c: MonitoringConfigurationDto) => {
    try {
      if (c.enabled) {
        await monitoringApi.disableConfiguration(c.id);
      } else {
        await monitoringApi.enableConfiguration(c.id);
      }
      await loadMonitoringData();
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const getStatusBadge = (status: MonitoringStatus) => {
    switch (status) {
      case 'SUCCESS':
        return {
          bg: '#ecfdf5',
          text: '#059669',
          border: '#a7f3d0',
          label: 'Healthy / Passed',
          icon: <CheckCircle2 size={12} />,
        };
      case 'RUNNING':
        return {
          bg: '#eff6ff',
          text: '#0284c7',
          border: '#bae6fd',
          label: 'Executing Now',
          icon: <RefreshCw size={12} className="spin" />,
        };
      case 'BLOCKED_AUTHORIZATION_EXPIRED':
        return {
          bg: '#fff1f2',
          text: '#e11d48',
          border: '#fecdd3',
          label: 'Blocked (Auth Expired)',
          icon: <Lock size={12} />,
        };
      case 'FAILED':
        return {
          bg: '#fef2f2',
          text: '#dc2626',
          border: '#fca5a5',
          label: 'Scan Failed',
          icon: <AlertTriangle size={12} />,
        };
      default:
        return {
          bg: '#f8fafc',
          text: '#64748b',
          border: '#e2e8f0',
          label: 'Scheduled Idle',
          icon: <Clock size={12} />,
        };
    }
  };

  const activeCount = configs.filter((c) => c.enabled).length;
  const uniqueTargetsCount = new Set(configs.map((c) => c.targetId)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '36px' }}>
      {/* Top Header Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '22px 26px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 10px rgba(2, 132, 199, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
              border: '1px solid #7dd3fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)',
            }}
          >
            <Activity size={24} style={{ color: '#0284c7' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Continuous Monitoring
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                }}
              >
                LIVE AUTONOMOUS
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Scheduled recurring vulnerability evaluations with automated pre-flight scope and certificate verification.
            </p>
          </div>
        </div>

        {/* Right Corner Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={loadMonitoringData}
            title="Refresh Monitoring State"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--brand-primary)';
              e.currentTarget.style.color = 'var(--brand-primary)';
              e.currentTarget.style.backgroundColor = '#f0f9ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            id="add-monitoring-schedule-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid #0284c7',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.45)';
              e.currentTarget.style.filter = 'brightness(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.35)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <Plus size={16} /> Add Schedule
          </button>
        </div>
      </div>

      {/* Metric KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Schedules
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {configs.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Configured automated routines
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <Calendar size={18} />
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Schedules
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
              {activeCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Recurring scans triggered on cadence
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <Zap size={18} />
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Monitored Targets
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
              {uniqueTargetsCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Distinct web target hosts covered
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <TargetIcon size={18} />
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Policy Enforcement
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
              Strict (100%)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Scope & cert re-verified before run
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Filter notice if active */}
      {(statusFilter || targetIdFilter) && (
        <div
          style={{
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#0369a1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} />
            <span>
              Filtered: {statusFilter && `Status = ${statusFilter}`} {targetIdFilter && `Target = ${targetIdFilter}`}
            </span>
          </div>
          <button
            onClick={() => setSearchParams({})}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '12px',
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

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

      {/* Safety Policy Notice */}
      <div
        style={{
          background: 'linear-gradient(90deg, #f0fdf4 0%, #f0f9ff 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '12px',
          color: '#1e293b',
          lineHeight: 1.5,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        <ShieldCheck size={18} style={{ color: '#059669', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#0f172a' }}>Pre-Flight Scope Compliance Guarantee:</strong> Prior to firing any scheduled
          recurring assessment, GlobalShield autonomously re-verifies the target's explicit scope and non-expired written
          authorization. If an authorization certificate expires, the engine automatically flags the run as{' '}
          <span style={{ color: '#e11d48', fontWeight: 700 }}>BLOCKED</span>, prohibiting unauthorized scans.
        </div>
      </div>

      {/* Main Schedules Table Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: 'var(--brand-primary)' }} />
            <span>Active Monitoring Configurations ({configs.length})</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {configs.length} active schedule rules
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '52px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={26} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
            <div style={{ fontWeight: 600 }}>Loading monitoring schedules...</div>
          </div>
        ) : configs.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#f0f9ff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <Activity size={28} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              No Monitoring Schedules Active
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px auto' }}>
              Automate recurring security scans to continuously track regression vectors, patch drifts, and newly exposed attack paths.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Plus size={15} /> Add First Schedule
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Target Scope</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Cadence</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>State</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Last Run Health</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Next Scheduled Execution</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>Controls</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => {
                  const badge = getStatusBadge(c.lastStatus);
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.targetName}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {c.targetUrl}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                          }}
                        >
                          <Clock size={11} />
                          {c.frequency}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: c.enabled ? '#ecfdf5' : '#f8fafc',
                            color: c.enabled ? '#059669' : '#64748b',
                            border: `1px solid ${c.enabled ? '#a7f3d0' : '#e2e8f0'}`,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: c.enabled ? '#10b981' : '#94a3b8',
                            }}
                          />
                          {c.enabled ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {c.nextRunAt ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{new Date(c.nextRunAt).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not scheduled</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggle(c)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${c.enabled ? '#fecaca' : '#bae6fd'}`,
                            background: c.enabled ? '#fff5f5' : '#f0f9ff',
                            color: c.enabled ? '#dc2626' : '#0284c7',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = c.enabled ? '#fee2e2' : '#e0f2fe';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = c.enabled ? '#fff5f5' : '#f0f9ff';
                          }}
                          title={c.enabled ? 'Pause schedule' : 'Enable schedule'}
                        >
                          <Power size={12} />
                          <span>{c.enabled ? 'Pause' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
        >
          <form
            onSubmit={handleCreateConfig}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px 28px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                  }}
                >
                  <Activity size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Add Monitoring Schedule
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Set up autonomous recurrent vulnerability checks
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Target Scope *
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.primaryUrl})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Only targets with authorized credentials will execute automatically.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Execution Cadence *
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as MonitoringFrequency)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="DAILY">Daily Assessment (Recommended for CI/CD)</option>
                  <option value="WEEKLY">Weekly Assessment (Recommended for Production)</option>
                  <option value="MONTHLY">Monthly Assessment (Governance & Compliance)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedTargetId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: '1px solid #0284c7',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: submitting || !selectedTargetId ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Check size={14} />
                <span>{submitting ? 'Activating...' : 'Activate Schedule'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
