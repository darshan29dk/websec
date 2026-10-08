import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Download,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Target as TargetIcon,
  XCircle,
} from 'lucide-react';
import { reportApi } from '../services/api/reportApi';
import { targetApi } from '../services/api/targetApi';
import { SecurityTarget } from '../types/target';
import {
  SecurityReportDto,
  ReportType,
  ReportFormat,
  ReportStatus,
} from '../types/report';

export const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetIdFromUrl = searchParams.get('targetId') || '';

  const [reports, setReports] = useState<SecurityReportDto[]>([]);
  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetIdFromUrl);
  const [reportType, setReportType] = useState<ReportType>('TECHNICAL_SECURITY_REPORT');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Preview Modal
  const [previewReport, setPreviewReport] = useState<SecurityReportDto | null>(null);

  useEffect(() => {
    loadReports();
    loadTargets();
  }, [targetIdFromUrl]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.searchReports(targetIdFromUrl || undefined);
      setReports(res.content || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load security reports');
    } finally {
      setLoading(false);
    }
  };

  const loadTargets = async () => {
    try {
      const res = await targetApi.listTargets();
      setTargets(res);
      if (res.length > 0 && !selectedTargetId) {
        setSelectedTargetId(targetIdFromUrl || res[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportApi.createReport({
        reportType,
        format,
        targetId: selectedTargetId || undefined,
        title: reportTitle || undefined,
      });
      setIsModalOpen(false);
      setReportTitle('');
      await loadReports();
    } catch (err: any) {
      alert('Failed to generate report: ' + (err?.message || 'Check backend configuration.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (report: SecurityReportDto) => {
    try {
      const { blob, filename } = await reportApi.downloadReportBlob(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      await reportApi.regenerateReport(id);
      await loadReports();
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to expire/archive this security report?')) return;
    try {
      await reportApi.deleteReport(id);
      await loadReports();
    } catch (err: any) {
      alert(`Archive failed: ${err.message}`);
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return {
          bg: '#ecfdf5',
          text: '#059669',
          border: '#a7f3d0',
          label: 'COMPLETED',
          icon: <CheckCircle2 size={12} />,
        };
      case 'GENERATING':
      case 'QUEUED':
        return {
          bg: '#fefce8',
          text: '#d97706',
          border: '#fde047',
          label: 'GENERATING',
          icon: <Clock size={12} className="spin" />,
        };
      case 'FAILED':
        return {
          bg: '#fef2f2',
          text: '#dc2626',
          border: '#fca5a5',
          label: 'FAILED',
          icon: <AlertTriangle size={12} />,
        };
      default:
        return {
          bg: '#f8fafc',
          text: '#64748b',
          border: '#e2e8f0',
          label: 'EXPIRED',
          icon: null,
        };
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
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
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
            <FileText size={22} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Security Reports & Compliance
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Deterministic evidence-grounded reports, cryptographic SHA-256 integrity verification, and multi-format exports.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={loadReports}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              color: 'var(--accent-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-light)';
              e.currentTarget.style.borderColor = 'var(--border-focus)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            id="generate-report-btn"
            style={{
              display: 'flex',
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
            <Plus size={16} /> Generate Report
          </button>
        </div>
      </div>

      {/* Target Filter Notice if filtered */}
      {targetIdFromUrl && (
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
            <TargetIcon size={16} />
            <span>
              Filtering reports for Target ID: <strong>{targetIdFromUrl}</strong>
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

      {/* Main Reports Table */}
      <div
        style={{
          background: 'var(--surface-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={16} style={{ color: 'var(--brand-primary)' }} />
            Generated Security Reports ({reports.length})
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
            <div>Loading security reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <FileText size={36} style={{ color: 'var(--brand-primary)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              No Security Reports Generated
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
              Generate comprehensive executive summaries, technical vulnerability disclosures, or defense compliance audits.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Generate First Report
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Report Title</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Target</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Format</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>SHA-256 Checksum</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const badge = getStatusBadge(r.status);
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.title}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {r.reportType.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {r.targetName || 'Global'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {r.format}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {r.checksum ? `${r.checksum.substring(0, 12)}...` : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => setPreviewReport(r)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
                              e.currentTarget.style.color = 'var(--text-main)';
                            }}
                            title="Preview Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(r)}
                            disabled={r.status !== 'COMPLETED'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: r.status === 'COMPLETED' ? 'var(--accent-light)' : '#f8fafc',
                              border: `1px solid ${r.status === 'COMPLETED' ? 'var(--border-focus)' : 'var(--border-color)'}`,
                              color: r.status === 'COMPLETED' ? 'var(--accent-primary)' : 'var(--text-muted)',
                              cursor: r.status === 'COMPLETED' ? 'pointer' : 'not-allowed',
                              opacity: r.status === 'COMPLETED' ? 1 : 0.45,
                              display: 'inline-flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              transition: 'all 0.15s ease',
                            }}
                            title="Download Report File"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleRegenerate(r.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-color)',
                              color: 'var(--accent-primary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                              e.currentTarget.style.borderColor = 'var(--border-focus)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                            title="Regenerate Report"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#fff5f5',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                              e.currentTarget.style.borderColor = '#f87171';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#fff5f5';
                              e.currentTarget.style.borderColor = '#fecaca';
                            }}
                            title="Archive Report"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
        >
          <form
            onSubmit={handleCreateReport}
            style={{
              background: 'var(--surface-primary)',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Generate Security Report
                </h3>
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
                <XCircle size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="EXECUTIVE_SECURITY_REPORT">Executive Security Report</option>
                  <option value="TECHNICAL_SECURITY_REPORT">Technical Security Report</option>
                  <option value="VULNERABILITY_REPORT">Vulnerability Report</option>
                  <option value="DEFENSE_VALIDATION_REPORT">Defense Validation Report</option>
                  <option value="SECURITY_POSTURE_REPORT">Security Posture Report</option>
                  <option value="REGRESSION_REPORT">Regression Analysis Report</option>
                  <option value="INCIDENT_REPORT">Incident Investigation Report</option>
                  <option value="FORENSIC_REPORT">Digital Forensics Report</option>
                  <option value="MONITORING_REPORT">Continuous Monitoring Report</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Export Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {(['PDF', 'HTML', 'CSV', 'JSON'] as ReportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      style={{
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: format === fmt ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                        background: format === fmt ? '#e0f2fe' : '#ffffff',
                        color: format === fmt ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Target Scope
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Global (All Targets)</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.primaryUrl})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Report Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Custom report title..."
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                  }}
                />
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
                disabled={submitting}
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
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {submitting ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Report Preview & Integrity
                </h3>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
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
                <XCircle size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Title:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{previewReport.title}</span>

              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
              <span style={{ color: 'var(--text-secondary)' }}>{previewReport.reportType}</span>

              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Format:</span>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{previewReport.format}</span>

              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
              <span>{previewReport.status}</span>

              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SHA-256:</span>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f8fafc', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', wordBreak: 'break-all' }}>
                {previewReport.checksum || 'N/A'}
              </div>

              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Created:</span>
              <span style={{ color: 'var(--text-secondary)' }}>{new Date(previewReport.createdAt).toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setPreviewReport(null)}
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
                Close
              </button>
              <button
                onClick={() => handleDownload(previewReport)}
                disabled={previewReport.status !== 'COMPLETED'}
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
                  cursor: previewReport.status === 'COMPLETED' ? 'pointer' : 'not-allowed',
                  opacity: previewReport.status === 'COMPLETED' ? 1 : 0.45,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Download size={14} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
