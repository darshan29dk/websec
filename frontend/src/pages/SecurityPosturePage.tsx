import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Activity,
  History,
  ArrowRight,
  Target as TargetIcon
} from 'lucide-react';
import { postureApi } from '../services/api/postureApi';
import { targetApi } from '../services/api/targetApi';
import { SecurityTarget } from '../types/target';
import {
  SecurityPostureSnapshotDto,
  SecurityPostureDimensionDto,
  PostureScoreFactorDto,
  PostureTrendPointDto,
  PostureRiskLevel,
  PostureDimensionType,
} from '../types/posture';

export const SecurityPosturePage: React.FC = () => {
  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [posture, setPosture] = useState<SecurityPostureSnapshotDto | null>(null);
  const [trends, setTrends] = useState<PostureTrendPointDto[]>([]);
  const [history, setHistory] = useState<SecurityPostureSnapshotDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<SecurityPostureDimensionDto | null>(null);

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadPostureData(selectedTargetId);
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

  const loadPostureData = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [posData, trendData, histData] = await Promise.all([
        postureApi.getCurrentPosture(targetId),
        postureApi.getPostureTrends(targetId),
        postureApi.getPostureHistory(targetId),
      ]);
      setPosture(posData);
      setTrends(trendData);
      setHistory(histData);
      if (posData.dimensions && posData.dimensions.length > 0) {
        setSelectedDimension(posData.dimensions[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load posture data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedTargetId) return;
    setRecalculating(true);
    try {
      const updated = await postureApi.recalculatePosture(selectedTargetId);
      setPosture(updated);
      await loadPostureData(selectedTargetId);
    } catch (err: any) {
      setError(err.message || 'Failed to recalculate security posture');
    } finally {
      setRecalculating(false);
    }
  };

  const getRiskBadge = (risk: PostureRiskLevel) => {
    switch (risk) {
      case 'EXCELLENT':
        return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">EXCELLENT</span>;
      case 'GOOD':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">GOOD</span>;
      case 'MODERATE':
        return <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">MODERATE</span>;
      case 'HIGH_RISK':
        return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-semibold">HIGH RISK</span>;
      case 'CRITICAL_RISK':
        return <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">CRITICAL RISK</span>;
      default:
        return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-full text-xs font-semibold">INSUFFICIENT DATA</span>;
    }
  };

  const formatDimensionName = (dim: PostureDimensionType) => {
    switch (dim) {
      case 'VULNERABILITY_RISK': return 'Vulnerability Risk';
      case 'ATTACK_SURFACE_RISK': return 'Attack Surface Risk';
      case 'CONFIGURATION_SECURITY': return 'Configuration Security';
      case 'REMEDIATION_HEALTH': return 'Remediation Health';
      case 'DEFENSE_VALIDATION': return 'Defense Validation';
      case 'REGRESSION_RISK': return 'Regression Risk';
      default: return dim;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Target Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Security Posture & Score</h1>
              <p className="text-slate-400 text-sm">Deterministic evidence-backed posture evaluation and trend analysis</p>
            </div>
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
            onClick={handleRecalculate}
            disabled={recalculating || !selectedTargetId}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Recalculating...' : 'Recalculate Posture'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Computing target security posture...</span>
        </div>
      ) : !posture ? (
        <div className="p-12 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Posture Snapshot Available</h3>
          <p className="text-slate-500 text-sm mt-1">Run an assessment or trigger recalculation to generate security posture metrics.</p>
        </div>
      ) : (
        <>
          {/* Main Score Hero Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900/80 p-6 rounded-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Overall Security Score</span>
                <div className="flex items-baseline space-x-3 mt-3">
                  <span className="text-6xl font-extrabold text-white tracking-tight">{posture.overallScore}</span>
                  <span className="text-slate-500 font-medium text-lg">/ 100</span>
                </div>
                <div className="mt-4 flex items-center space-x-3">
                  {getRiskBadge(posture.riskLevel)}
                  {posture.scoreDelta != null && (
                    <span className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-md border ${
                      posture.scoreDelta > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : posture.scoreDelta < 0
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {posture.scoreDelta > 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : posture.scoreDelta < 0 ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : null}
                      {posture.scoreDelta > 0 ? `+${posture.scoreDelta}` : posture.scoreDelta} from prev
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                <div>Calculated: <span className="text-slate-200">{new Date(posture.calculatedAt).toLocaleString()}</span></div>
                <div>Algorithm Version: <span className="text-slate-300 font-mono">{posture.scoreVersion}</span></div>
              </div>
            </div>

            {/* Explanation Factor Highlights */}
            <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-xl border border-slate-800">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Why did the score change? (Explainable Factors)</span>
              </h3>
              <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-2">
                {posture.factors && posture.factors.length > 0 ? (
                  posture.factors.map((f, i) => (
                    <div key={i} className="flex items-start justify-between p-2.5 bg-slate-800/40 rounded-lg border border-slate-800/60">
                      <div className="flex items-start space-x-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold mt-0.5 ${
                          f.impact > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          f.impact < 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {f.impact > 0 ? `+${f.impact}` : f.impact}
                        </span>
                        <div>
                          <div className="text-xs font-medium text-slate-200">{f.factorName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{f.explanation}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase px-2 py-0.5 bg-slate-800 rounded">
                        {f.dimension.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs italic">No specific factor adjustments recorded.</p>
                )}
              </div>
            </div>
          </div>

          {/* Security Posture Dimensions Grid */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Security Posture Dimensions</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posture.dimensions.map((dim) => {
                const isSelected = selectedDimension?.id === dim.id;
                return (
                  <div
                    key={dim.id}
                    onClick={() => setSelectedDimension(dim)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {formatDimensionName(dim.dimension)}
                      </span>
                      <span className={`text-lg font-extrabold ${
                        dim.score === null ? 'text-slate-500' :
                        dim.score >= 80 ? 'text-emerald-400' :
                        dim.score >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {dim.score != null ? `${dim.score}/100` : 'N/A'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{dim.explanation}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
                      <span>Evidence Count: <strong className="text-slate-300">{dim.evidenceCount}</strong></span>
                      <span className="text-indigo-400 hover:underline flex items-center space-x-1">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dimension Inspector Panel */}
          {selectedDimension && (
            <div className="bg-slate-900/90 p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Dimension Detail: {formatDimensionName(selectedDimension.dimension)}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{selectedDimension.explanation}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-400">{selectedDimension.score ?? 'N/A'}</span>
                  <span className="text-slate-500 text-xs font-medium"> / 100</span>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contributing Score Factors</h5>
                <div className="space-y-2">
                  {selectedDimension.factors && selectedDimension.factors.length > 0 ? (
                    selectedDimension.factors.map((fac, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{fac.factorName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{fac.explanation}</div>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          fac.impact > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {fac.impact > 0 ? `+${fac.impact}` : fac.impact}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No individual factor penalties or bonuses registered for this dimension.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historical Trend */}
          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Historical Score Trend</span>
            </h3>
            {trends.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {trends.map((t, i) => (
                  <div key={i} className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 text-center">
                    <div className="text-2xl font-bold text-white">{t.score}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{new Date(t.timestamp).toLocaleDateString()}</div>
                    <div className="text-[10px] text-indigo-400 font-mono mt-1">Regressions: {t.regressionCount}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic">Not enough historical data for trend chart.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
