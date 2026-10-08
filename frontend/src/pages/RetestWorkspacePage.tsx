import React, { useEffect, useState } from 'react';
import { retestApi } from '../services/api/retestApi';
import { findingApi } from '../services/api/findingApi';
import {
  Retest,
  RetestCheck,
  RetestEvidence,
  DefenseValidation,
  RetestDashboardMetrics,
} from '../types/retest';
import {
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileSearch,
  ArrowRight,
  Lock,
  Play,
} from 'lucide-react';

export const RetestWorkspacePage: React.FC = () => {
  const [metrics, setMetrics] = useState<RetestDashboardMetrics | null>(null);
  const [retests, setRetests] = useState<Retest[]>([]);
  const [selectedRetest, setSelectedRetest] = useState<Retest | null>(null);
  const [checks, setChecks] = useState<RetestCheck[]>([]);
  const [evidence, setEvidence] = useState<RetestEvidence[]>([]);
  const [validation, setValidation] = useState<DefenseValidation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const m = await retestApi.getDashboardMetrics().catch(() => null);
      setMetrics(m);
      const findingsRes = await findingApi.getFindings(0, 10).catch(() => ({ content: [] }));
      const findings = findingsRes?.content || [];
      if (findings.length > 0) {
        const allRetests = await retestApi.listRetestsForFinding(findings[0].id).catch(() => []);
        setRetests(allRetests);
        if (allRetests.length > 0 && !selectedRetest) {
          setSelectedRetest(allRetests[0]);
        }
      } else {
        setRetests([]);
      }
    } catch (err) {
      console.error('Failed to load retest workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRetestDetails = async (retest: Retest) => {
    setSelectedRetest(retest);
    try {
      const [c, ev, val] = await Promise.all([
        retestApi.getRetestChecks(retest.id).catch(() => []),
        retestApi.getRetestEvidence(retest.id).catch(() => []),
        retestApi.getRetestValidation(retest.id).catch(() => null),
      ]);
      setChecks(c);
      setEvidence(ev);
      setValidation(val);
    } catch (err) {
      console.error('Failed to load retest details:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRetest) {
      loadRetestDetails(selectedRetest);
    }
  }, [selectedRetest?.id]);

  const handleStartRetest = async (id: string) => {
    try {
      const updated = await retestApi.startRetest(id);
      setSelectedRetest(updated);
      setRetests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      loadRetestDetails(updated);
    } catch (err) {
      console.error('Failed to start retest:', err);
    }
  };

  const getValidationBadgeClass = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'FIXED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PARTIALLY_FIXED':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'NOT_FIXED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'REGRESSED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold animate-pulse';
      case 'INCONCLUSIVE':
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileSearch className="w-7 h-7 text-cyan-400" />
            Controlled Retesting & Defense Validation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Evidence-grounded security weakness revalidation, before/after comparison, and regression detection.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            <RotateCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Security Safety Banner */}
      <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-cyan-200/90 leading-relaxed">
          <span className="font-semibold text-cyan-300">Controlled Verification Scope:</span> Retesting executes strictly against registered active targets with confirmed scope authorization. Arbitrary URLs, shell execution, or LLM-generated commands are strictly prohibited by Phase 2 security policy rules.
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Retests</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{metrics?.totalRetests ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Awaiting</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{metrics?.awaitingRetest ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Retesting</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{metrics?.currentlyRetesting ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fixed</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{metrics?.fixedCount ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Partial Fix</div>
          <div className="text-xl font-bold text-yellow-400 mt-1">{metrics?.partiallyFixedCount ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Not Fixed</div>
          <div className="text-xl font-bold text-red-400 mt-1">{metrics?.notFixedCount ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Regressed</div>
          <div className="text-xl font-bold text-rose-400 mt-1">{metrics?.regressedCount ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Inconclusive</div>
          <div className="text-xl font-bold text-slate-400 mt-1">{metrics?.inconclusiveCount ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Retests List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Validation History ({retests.length})</h3>

          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
              Loading retest history...
            </div>
          ) : retests.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
              No retests recorded. Initiate a retest from a Security Finding detail page.
            </div>
          ) : (
            retests.map((retest) => (
              <div
                key={retest.id}
                onClick={() => loadRetestDetails(retest)}
                className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition ${
                  selectedRetest?.id === retest.id
                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{retest.findingTitle || 'Security Weakness Retest'}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getValidationBadgeClass(retest.validation?.validationStatus || retest.status)}`}>
                    {retest.validation?.validationStatus || retest.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">Target: {retest.targetName || retest.targetUrl}</p>

                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>User: <strong className="text-slate-300">{retest.requestedBy}</strong></span>
                  <span className="font-mono text-[10px]">{new Date(retest.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Retest Inspector & Evidence Comparison */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          {selectedRetest ? (
            <>
              {/* Retest Detail Header */}
              <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      RETEST #{selectedRetest.uuid.substring(0, 8)}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${getValidationBadgeClass(validation?.validationStatus || selectedRetest.status)}`}>
                      {validation?.validationStatus || selectedRetest.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 mt-2">{selectedRetest.findingTitle || 'Controlled Finding Retest'}</h2>
                  <p className="text-xs text-slate-400 mt-1">Scope Target: <span className="font-mono text-cyan-400">{selectedRetest.targetUrl}</span></p>
                </div>

                {selectedRetest.status === 'QUEUED' && (
                  <button
                    onClick={() => handleStartRetest(selectedRetest.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition"
                  >
                    <Play className="w-3.5 h-3.5" /> Start Retest
                  </button>
                )}
              </div>

              {/* Defense Validation Result Panel */}
              {validation ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Defense Validation Decision</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/30">
                      CONFIDENCE: {validation.confidence}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/60 p-3 rounded border border-slate-800">
                    {validation.summary}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 italic text-center">
                  Retest in progress or queued. Validation decision will generate upon check completion.
                </div>
              )}

              {/* Controlled Checks Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executed Retest Checks ({checks.length})</h3>
                <div className="space-y-2">
                  {checks.map((check) => (
                    <div key={check.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-cyan-400 font-semibold">{check.checkType}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          check.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {check.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">Tool: <strong className="text-slate-200">{check.toolName}</strong></div>
                      <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800">
                        Expected: {check.expectedCondition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Before vs After Evidence Comparison Panel */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Before / After Evidence Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* BEFORE: Baseline Evidence */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> BEFORE (Assessment Evidence)
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-900 p-2.5 rounded border border-slate-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {evidence.find((e) => e.source === 'ASSESSMENT_BASELINE')?.evidenceData || 'Original assessment vulnerability baseline evidence.'}
                    </div>
                  </div>

                  {/* AFTER: Retest Evidence */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                      <CheckCircle className="w-3.5 h-3.5" /> AFTER (Retest Observation)
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono bg-slate-900 p-2.5 rounded border border-slate-800 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {evidence.find((e) => e.source !== 'ASSESSMENT_BASELINE')?.evidenceData || 'New retest check observation evidence.'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-400 text-sm py-12">
              Select a retest from the history list to view validation results and before/after evidence comparison.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
