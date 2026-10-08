import React, { useState, useEffect } from 'react';
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
  Target as TargetIcon
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
  const [reports, setReports] = useState<SecurityReportDto[]>([]);
  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>('TECHNICAL_SECURITY_REPORT');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Preview Modal
  const [previewReport, setPreviewReport] = useState<SecurityReportDto | null>(null);

  useEffect(() => {
    loadReports();
    loadTargets();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.searchReports();
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
      if (res.length > 0) {
        setSelectedTargetId(res[0].id);
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
      setError(err.message || 'Failed to generate report');
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
        return <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 mr-1" />COMPLETED</span>;
      case 'GENERATING':
      case 'QUEUED':
        return <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-semibold flex items-center space-x-1"><Clock className="w-3 h-3 mr-1 animate-spin" />GENERATING</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold">FAILED</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded text-xs font-semibold">EXPIRED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Reports & Compliance</h1>
            <p className="text-slate-400 text-sm">Generate, download, and verify integrity of evidence-based security reports</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            <span>Generated Security Reports ({reports.length})</span>
          </h3>

          <button onClick={loadReports} className="p-1.5 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No reports generated yet. Click "Generate Report" to create a PDF/HTML/CSV/JSON report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Report Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Format</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">SHA-256 Checksum</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-white">{r.title}</td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">{r.reportType.replace(/_/g, ' ')}</td>
                    <td className="p-4">{r.targetName || 'Global'}</td>
                    <td className="p-4 font-bold text-indigo-400">{r.format}</td>
                    <td className="p-4">{getStatusBadge(r.status)}</td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      {r.checksum ? `${r.checksum.substring(0, 12)}...` : 'N/A'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setPreviewReport(r)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Preview Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(r)}
                        disabled={r.status !== 'COMPLETED'}
                        className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 disabled:opacity-30 text-indigo-400 border border-indigo-500/30 rounded"
                        title="Download File"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRegenerate(r.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Regenerate Report"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded"
                        title="Archive Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateReport} className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Generate Security Report</span>
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="mt-1 w-full bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
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
                <label className="text-xs text-slate-400 uppercase font-semibold">Export Format</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {(['PDF', 'HTML', 'CSV', 'JSON'] as ReportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        format === fmt
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Target</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="mt-1 w-full bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
                >
                  <option value="">Global (All Targets)</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.primaryUrl})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Report Title (Optional)</label>
                <input
                  type="text"
                  placeholder="Custom report title..."
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="mt-1 w-full bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20"
              >
                {submitting ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <span>Report Preview & Integrity</span>
              </h3>
              <button onClick={() => setPreviewReport(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div><strong className="text-slate-400">Title:</strong> <span className="text-white font-semibold">{previewReport.title}</span></div>
              <div><strong className="text-slate-400">Type:</strong> <span className="text-slate-200">{previewReport.reportType}</span></div>
              <div><strong className="text-slate-400">Format:</strong> <span className="text-indigo-400 font-bold">{previewReport.format}</span></div>
              <div><strong className="text-slate-400">Status:</strong> {getStatusBadge(previewReport.status)}</div>
              <div><strong className="text-slate-400">SHA-256 Checksum:</strong> <div className="font-mono bg-slate-800 p-2 rounded text-slate-300 break-all mt-1">{previewReport.checksum || 'N/A'}</div></div>
              <div><strong className="text-slate-400">Created:</strong> <span className="text-slate-300">{new Date(previewReport.createdAt).toLocaleString()}</span></div>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button onClick={() => setPreviewReport(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs">
                Close
              </button>
              <button
                onClick={() => handleDownload(previewReport)}
                disabled={previewReport.status !== 'COMPLETED'}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Download className="w-4 h-4 mr-1" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
