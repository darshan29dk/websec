import React, { useState, useEffect } from 'react';
import {
  History,
  Activity,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Target as TargetIcon,
  RefreshCw
} from 'lucide-react';
import { historyApi } from '../services/api/historyApi';
import { targetApi } from '../services/api/targetApi';
import { SecurityTarget } from '../types/target';
import { SecurityHistoryTimelineDto, TimelineEventItem } from '../types/history';

export const SecurityHistoryPage: React.FC = () => {
  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [history, setHistory] = useState<SecurityHistoryTimelineDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadHistory(selectedTargetId);
    }
  }, [selectedTargetId]);

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

  const loadHistory = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await historyApi.getTargetSecurityHistory(targetId);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load target security history');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (category: string) => {
    switch (category) {
      case 'ASSESSMENT': return <Activity className="w-4 h-4 text-indigo-400" />;
      case 'FINDING_CHANGE': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'DEFENSE_VALIDATION': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'REGRESSION': return <RotateCcw className="w-4 h-4 text-rose-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Target Security History Timeline</h1>
            <p className="text-slate-400 text-sm">Immutable chronological security event log across assessments, findings, retests, and posture shifts</p>
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

          <button onClick={() => loadHistory(selectedTargetId)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700">
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

      {/* History Timeline */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading security history timeline...</div>
      ) : !history ? (
        <div className="p-12 text-center text-slate-500">No security history recorded for this target.</div>
      ) : (
        <div className="space-y-6">
          {/* Target Score Summary Header */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{history.targetName}</h3>
              <p className="text-xs font-mono text-slate-400">{history.primaryUrl}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-indigo-400">{history.currentScore} / 100</div>
              <div className="text-xs text-slate-400 font-semibold">{history.currentRiskLevel}</div>
            </div>
          </div>

          {/* Timeline Events */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6">
            <h3 className="text-base font-bold text-white mb-4">Chronological Event Stream ({history.events.length})</h3>

            <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
              {history.events.map((ev) => (
                <div key={ev.eventId} className="relative pl-6">
                  <div className="absolute -left-3 top-0.5 p-1 bg-slate-900 border border-slate-700 rounded-full">
                    {getEventIcon(ev.category)}
                  </div>
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{ev.title}</h4>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{ev.summary}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">
                        {ev.category}
                      </span>
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">
                        {ev.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
