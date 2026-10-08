import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Target as TargetIcon,
  RefreshCw,
  FileText
} from 'lucide-react';
import { postureApi } from '../services/api/postureApi';
import { targetApi } from '../services/api/targetApi';
import { SecurityTarget } from '../types/target';
import {
  SecurityRegressionDto,
  RegressionSummaryDto,
  RegressionStatus,
  RegressionType,
  RegressionConfidence,
} from '../types/posture';

export const RegressionCenterPage: React.FC = () => {
  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [summary, setSummary] = useState<RegressionSummaryDto | null>(null);
  const [regressions, setRegressions] = useState<SecurityRegressionDto[]>([]);
  const [selectedRegression, setSelectedRegression] = useState<SecurityRegressionDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadRegressionData(selectedTargetId);
    }
  }, [selectedTargetId, filterType, filterStatus]);

  const loadTargets = async () => {
    try {
      const res = await targetApi.listTargets();
      setTargets(res);
      if (res.length > 0) {
        setSelectedTargetId(res[0].id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load targets');
      setLoading(false);
    }
  };

  const loadRegressionData = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, listData] = await Promise.all([
        postureApi.getRegressionSummary(targetId),
        postureApi.getRegressions(targetId, filterType || undefined, undefined, filterStatus || undefined),
      ]);
      setSummary(sumData);
      setRegressions(listData);
    } catch (err: any) {
      setError(err.message || 'Failed to load regression records');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: RegressionType) => {
    switch (type) {
      case 'REOPENED':
        return <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold">REOPENED</span>;
      case 'REGRESSED':
        return <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-xs font-semibold">REGRESSED</span>;
      case 'DEFENSE_REGRESSION':
        return <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-semibold">DEFENSE REGRESSION</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded text-xs font-semibold">{type}</span>;
    }
  };

  const getStatusBadge = (status: RegressionStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold">CONFIRMED</span>;
      case 'POTENTIAL':
        return <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-semibold">POTENTIAL</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold">RESOLVED</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded text-xs font-semibold">INCONCLUSIVE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Vulnerability Regression Center</h1>
            <p className="text-slate-400 text-sm">Historical re-appearance tracking & fingerprint-matched regression detection</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
            <TargetIcon className="w-4 h-4 text-slate-400" />
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="bg-transparent text-slate-200 text-sm font-medium focus:outline-none cursor-pointer"
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                  {t.name} ({t.primaryUrl})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadRegressionData(selectedTargetId)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Regression Summary Banner */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-black text-white">{summary.totalRegressions}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Events</div>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-black text-rose-400">{summary.confirmedRegressions}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Confirmed</div>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-black text-amber-400">{summary.potentialRegressions}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Potential</div>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-black text-emerald-400">{summary.resolvedRegressions}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Resolved</div>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-black text-indigo-400">
              {summary.regressionRate >= 0 ? `${summary.regressionRate}%` : 'N/A'}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Regression Rate</div>
          </div>
        </div>
      )}

      {/* Regressions List & Filters */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Detected Vulnerability Regressions</span>
          </h3>

          <div className="flex items-center space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="REOPENED">REOPENED</option>
              <option value="REGRESSED">REGRESSED</option>
              <option value="DEFENSE_REGRESSION">DEFENSE REGRESSION</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="POTENTIAL">POTENTIAL</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
            <span>Fetching regression records...</span>
          </div>
        ) : regressions.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-slate-200 font-semibold">No Vulnerability Regressions Detected</h4>
            <p className="text-slate-500 text-xs mt-1">None of the previously fixed findings have reappeared on this target.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Finding Title</th>
                  <th className="p-4">Fingerprint</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Detected At</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {regressions.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-medium text-white">{reg.findingTitle}</td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      {reg.findingFingerprint.substring(0, 12)}...
                    </td>
                    <td className="p-4">{getTypeBadge(reg.regressionType)}</td>
                    <td className="p-4 font-semibold text-slate-300">{reg.confidence}</td>
                    <td className="p-4">{getStatusBadge(reg.status)}</td>
                    <td className="p-4 text-slate-400">{new Date(reg.detectedAt).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedRegression(reg)}
                        className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded text-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Regression Detail Inspector Modal */}
      {selectedRegression && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <span>Regression Details</span>
              </h3>
              <button
                onClick={() => setSelectedRegression(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Finding Title</label>
                <div className="text-base font-bold text-white mt-0.5">{selectedRegression.findingTitle}</div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Finding Fingerprint (SHA-256)</label>
                <div className="text-xs font-mono bg-slate-800/80 p-2 rounded border border-slate-700 text-slate-300 break-all mt-0.5">
                  {selectedRegression.findingFingerprint}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Type</label>
                  <div className="mt-1">{getTypeBadge(selectedRegression.regressionType)}</div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRegression.status)}</div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Explanation</label>
                <div className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded border border-slate-800 mt-1">
                  {selectedRegression.explanation}
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-2 border-t border-slate-800 flex justify-between">
                <span>Detected At: {new Date(selectedRegression.detectedAt).toLocaleString()}</span>
                <span>Confidence: {selectedRegression.confidence}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedRegression(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
