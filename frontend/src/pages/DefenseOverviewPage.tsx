import React, { useEffect, useState } from 'react';
import { defenseApi } from '../services/api/defenseApi';
import {
  DefenseRecommendation,
  DefenseControl,
  DefenseOverviewMetrics,
} from '../types/defense';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BookOpenIcon,
  KeyIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export const DefenseOverviewPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DefenseOverviewMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<DefenseRecommendation[]>([]);
  const [controls, setControls] = useState<DefenseControl[]>([]);
  const [selectedRec, setSelectedRec] = useState<DefenseRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'controls'>('recommendations');
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, recs, ctrls] = await Promise.all([
        defenseApi.getOverviewMetrics(),
        defenseApi.listRecommendations(statusFilter || undefined),
        defenseApi.listControls(),
      ]);
      setMetrics(m);
      setRecommendations(recs);
      setControls(ctrls);
      if (recs.length > 0 && !selectedRec) {
        setSelectedRec(recs[0]);
      }
    } catch (err) {
      console.error('Failed to load defense data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const updated = await defenseApi.reviewRecommendation(id, action);
      setRecommendations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRec?.id === id) setSelectedRec(updated);
    } catch (err) {
      console.error('Failed to review recommendation:', err);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const updated = await defenseApi.updateRecommendationStatus(id, status);
      setRecommendations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRec?.id === id) setSelectedRec(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'IMPLEMENTED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'VERIFIED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheckIcon className="w-7 h-7 text-emerald-400" />
            Defense & Remediation Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Evidence-grounded security control recommendations, root-cause mapping, and validation plans.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Security Safety Banner */}
      <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3">
        <ShieldExclamationIcon className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-cyan-200/90 leading-relaxed">
          <span className="font-semibold text-cyan-300">Human Control Boundary:</span> AEGIS provides evidence-backed security recommendations, control mappings, and validation plans. AEGIS does <strong className="text-cyan-200">NOT</strong> automatically modify production websites, firewalls, or application source code. All remediation activities remain under authorized human control.
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Recs</div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{metrics?.openRecommendations ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Awaiting Review</div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{metrics?.awaitingReview ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Critical Priority</div>
          <div className="text-2xl font-bold text-red-400 mt-2">{metrics?.criticalRemediations ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">High Priority</div>
          <div className="text-2xl font-bold text-orange-400 mt-2">{metrics?.highPriorityRemediations ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Implemented</div>
          <div className="text-2xl font-bold text-purple-400 mt-2">{metrics?.implemented ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Awaiting Verification</div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{metrics?.awaitingVerification ?? 0}</div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-5 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'recommendations'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheckIcon className="w-4 h-4" />
          Defense Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-5 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'controls'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpenIcon className="w-4 h-4" />
          Security Controls Library ({controls.length})
        </button>
      </div>

      {/* Recommendations View */}
      {activeTab === 'recommendations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List Section */}
          <div className="lg:col-span-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Filter Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="PROPOSED">PROPOSED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="IMPLEMENTED">IMPLEMENTED</option>
              </select>
            </div>

            {loading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
                Loading defense recommendations...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
                No defense recommendations found. Generate recommendations from Findings or Assessment pages.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRec(rec)}
                    className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition ${
                      selectedRec?.id === rec.id
                        ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">{rec.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadgeClass(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{rec.summary}</p>

                    <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded">
                          {rec.rootCause}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(rec.status)}`}>
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Inspector Drawer */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            {selectedRec ? (
              <>
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${getPriorityBadgeClass(selectedRec.priority)}`}>
                        {selectedRec.priority} PRIORITY
                      </span>
                      <h2 className="text-lg font-bold text-slate-100 mt-2">{selectedRec.title}</h2>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded border ${getStatusBadgeClass(selectedRec.status)}`}>
                      {selectedRec.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Finding: {selectedRec.findingTitle || 'Target Endpoint Finding'}</p>
                </div>

                {/* Review Actions */}
                <div className="flex gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handleReview(selectedRec.id, 'APPROVE')}
                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircleIcon className="w-4 h-4" /> Approve Recommendation
                  </button>
                  <button
                    onClick={() => handleReview(selectedRec.id, 'REJECT')}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition"
                  >
                    <XCircleIcon className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRec.id, 'IMPLEMENTED')}
                    className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition"
                  >
                    <ClockIcon className="w-4 h-4" /> Mark Implemented
                  </button>
                </div>

                {/* Root Cause Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Root Cause Analysis</h4>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                    <div className="font-mono text-emerald-400 font-semibold mb-1">{selectedRec.rootCause}</div>
                    <p>{selectedRec.rootCauseExplanation || 'Root cause established from vulnerability mechanics and evidence.'}</p>
                  </div>
                </div>

                {/* Primary Security Controls */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mapped Security Controls</h4>
                  <div className="space-y-2">
                    {selectedRec.primaryControls && selectedRec.primaryControls.length > 0 ? (
                      selectedRec.primaryControls.map((ctrl) => (
                        <div key={ctrl.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                          <div className="flex justify-between font-mono text-cyan-400 font-semibold">
                            <span>{ctrl.controlCode} — {ctrl.name}</span>
                            <span className="text-[10px] text-slate-400">{ctrl.category}</span>
                          </div>
                          <p className="text-slate-300 mt-1">{ctrl.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic">No mapped controls recorded.</div>
                    )}
                  </div>
                </div>

                {/* Implementation Guidance */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Implementation Guidance</h4>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-mono">
                    {selectedRec.implementationGuidance || 'Follow secure coding guidelines and apply defensive controls.'}
                  </div>
                </div>

                {/* Compensating Controls */}
                {selectedRec.compensatingControls && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Temporary Compensating Controls</h4>
                    <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-500/30 text-xs text-amber-200">
                      {selectedRec.compensatingControls}
                    </div>
                  </div>
                )}

                {/* Validation Plan */}
                {selectedRec.validationPlan && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Validation Plan (Phase 8 Retest Preparation)</h4>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5">
                      <div className="font-semibold text-slate-200">{selectedRec.validationPlan.planTitle}</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        {selectedRec.validationPlan.validationSteps?.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-400 text-sm py-12">
                Select a defense recommendation to view implementation details and controls.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Controls Library Tab */}
      {activeTab === 'controls' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {controls.map((ctrl) => (
            <div key={ctrl.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {ctrl.controlCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-2">{ctrl.name}</h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  {ctrl.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{ctrl.description}</p>
              
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Implementation Guidance</div>
                <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800 font-mono">
                  {ctrl.implementationGuidance || 'Apply security standard controls.'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Validation Guidance</div>
                <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800 font-mono">
                  {ctrl.validationGuidance || 'Verify with security assessment retest.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
