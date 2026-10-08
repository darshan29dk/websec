import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Layers,
  RefreshCw,
  Target as TargetIcon
} from 'lucide-react';
import { postureApi } from '../services/api/postureApi';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { Target } from '../types/target';
import { Assessment } from '../types/assessment';
import { AssessmentComparisonDto } from '../types/posture';

export const AssessmentComparePage: React.FC = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [prevAssessmentId, setPrevAssessmentId] = useState<string>('');
  const [currAssessmentId, setCurrAssessmentId] = useState<string>('');
  const [comparison, setComparison] = useState<AssessmentComparisonDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadAssessments(selectedTargetId);
    }
  }, [selectedTargetId]);

  const loadTargets = async () => {
    try {
      const res = await targetApi.listTargets();
      setTargets(res);
      if (res.length > 0) {
        setSelectedTargetId(res[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load targets');
    }
  };

  const loadAssessments = async (targetId: string) => {
    try {
      const res = await assessmentApi.listAssessments(targetId);
      const items = res.content || [];
      setAssessments(items);
      if (items.length >= 2) {
        setCurrAssessmentId(items[0].id);
        setPrevAssessmentId(items[1].id);
      } else if (items.length === 1) {
        setCurrAssessmentId(items[0].id);
        setPrevAssessmentId('');
      } else {
        setCurrAssessmentId('');
        setPrevAssessmentId('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load target assessments');
    }
  };

  const handleCompare = async () => {
    if (!selectedTargetId || !currAssessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await postureApi.compareAssessments(
        selectedTargetId,
        currAssessmentId,
        prevAssessmentId || undefined
      );
      setComparison(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute assessment comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Selectors */}
      <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Assessment-to-Assessment Comparison</h1>
            <p className="text-slate-400 text-sm">Compare security finding states, posture score deltas, and attack surface shifts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold">Target</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="mt-1 w-full bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold">Previous Assessment (Baseline)</label>
            <select
              value={prevAssessmentId}
              onChange={(e) => setPrevAssessmentId(e.target.value)}
              className="mt-1 w-full bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
            >
              <option value="">(None - Initial Baseline)</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  Assessment {a.id.substring(0, 8)} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold">Current Assessment</label>
            <select
              value={currAssessmentId}
              onChange={(e) => setCurrAssessmentId(e.target.value)}
              className="mt-1 w-full bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  Assessment {a.id.substring(0, 8)} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCompare}
              disabled={loading || !currAssessmentId}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Compare Assessments</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-white">
                {comparison.previousScore != null ? comparison.previousScore : 'N/A'} → {comparison.currentScore != null ? comparison.currentScore : 'N/A'}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Score Transition</div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-indigo-400">
                {comparison.newFindings.length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">New Findings</div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-emerald-400">
                {comparison.fixedFindings.length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Fixed Findings</div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-slate-300">
                {comparison.unchangedFindings.length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Unchanged</div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-rose-400">
                {comparison.reopenedFindings.length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Reopened / Regressed</div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
            <strong>Explanation:</strong> {comparison.summaryExplanation}
          </div>

          {/* New Findings Matrix */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Newly Introduced Findings ({comparison.newFindings.length})</span>
            </h3>
            {comparison.newFindings.length > 0 ? (
              <div className="space-y-2">
                {comparison.newFindings.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">{item.endpoint}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded font-semibold">
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No new findings introduced in current assessment.</p>
            )}
          </div>

          {/* Fixed Findings Matrix */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Remediated / Fixed Findings ({comparison.fixedFindings.length})</span>
            </h3>
            {comparison.fixedFindings.length > 0 ? (
              <div className="space-y-2">
                {comparison.fixedFindings.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">{item.endpoint}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold">
                      FIXED
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No previous findings fixed in current assessment.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
