import React, { useState, useEffect } from 'react';
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
  Lock
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
  const [configs, setConfigs] = useState<MonitoringConfigurationDto[]>([]);
  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [frequency, setFrequency] = useState<MonitoringFrequency>('WEEKLY');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadMonitoringData();
    loadTargets();
  }, []);

  const loadMonitoringData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await monitoringApi.getAllConfigurations();
      setConfigs(res);
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
      if (res.length > 0) {
        setSelectedTargetId(res[0].id);
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
      setError(err.message || 'Failed to configure monitoring schedule');
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
        return <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold">SUCCESS</span>;
      case 'RUNNING':
        return <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-semibold flex items-center space-x-1"><RefreshCw className="w-3 h-3 animate-spin mr-1" />RUNNING</span>;
      case 'BLOCKED_AUTHORIZATION_EXPIRED':
        return <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold flex items-center space-x-1"><Lock className="w-3 h-3 mr-1" />BLOCKED (EXPIRED AUTH)</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold">FAILED</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded text-xs font-semibold">IDLE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Continuous Authorized Monitoring</h1>
            <p className="text-slate-400 text-sm">Automated recurring security assessment schedules with mandatory authorization checks</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Monitoring Schedule</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Safety Boundary Note */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Strict Authorization Enforced:</strong> Before executing any scheduled monitoring run, AEGIS re-validates target status and unexpired authorization records. If target authorization expires, scheduled monitoring is automatically BLOCKED.
        </div>
      </div>

      {/* Monitoring Schedules Table */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>Active Monitoring Configurations ({configs.length})</span>
          </h3>

          <button onClick={loadMonitoringData} className="p-1.5 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading monitoring configurations...</div>
        ) : configs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No continuous monitoring configurations set up. Click "Add Monitoring Schedule" to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Target Name</th>
                  <th className="p-4">Primary URL</th>
                  <th className="p-4">Frequency</th>
                  <th className="p-4">State</th>
                  <th className="p-4">Last Run Status</th>
                  <th className="p-4">Next Run Scheduled</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {configs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-white">{c.targetName}</td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">{c.targetUrl}</td>
                    <td className="p-4 font-bold text-indigo-400">{c.frequency}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        c.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {c.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(c.lastStatus)}</td>
                    <td className="p-4 text-slate-400">
                      {c.nextRunAt ? new Date(c.nextRunAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggle(c)}
                        className={`p-1.5 rounded transition-colors ${
                          c.enabled
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                        }`}
                        title={c.enabled ? 'Disable Schedule' : 'Enable Schedule'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateConfig} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <span>Add Continuous Monitoring Schedule</span>
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Target</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="mt-1 w-full bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
                  required
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.primaryUrl})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Schedule Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as MonitoringFrequency)}
                  className="mt-1 w-full bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
                >
                  <option value="DAILY">Daily Assessment</option>
                  <option value="WEEKLY">Weekly Assessment</option>
                  <option value="MONTHLY">Monthly Assessment</option>
                </select>
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
                disabled={submitting || !selectedTargetId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20"
              >
                {submitting ? 'Saving...' : 'Enable Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
