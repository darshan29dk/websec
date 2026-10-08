import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { forensicApi } from '../services/api/forensicApi';
import {
  ForensicCase,
  ForensicEvidence,
  TimelineEvent,
  HttpForensicEvent,
  NetworkForensicEvent,
  AttackEvent,
  ForensicSummary,
  EvidenceVerification
} from '../types/forensic';
import {
  FolderGit2, ShieldAlert, CheckCircle2, Clock, Hash, FileCode, Network,
  Activity, Lock, AlertTriangle, FileText, ArrowLeft, RefreshCw, Plus
} from 'lucide-react';

export const ForensicDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [forensicCase, setForensicCase] = useState<ForensicCase | null>(null);
  const [summary, setSummary] = useState<ForensicSummary | null>(null);
  const [evidenceList, setEvidenceList] = useState<ForensicEvidence[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [httpEvents, setHttpEvents] = useState<HttpForensicEvent[]>([]);
  const [networkEvents, setNetworkEvents] = useState<NetworkForensicEvent[]>([]);
  const [attackEvents, setAttackEvents] = useState<AttackEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'evidence' | 'http' | 'network' | 'reconstruction' | 'integrity'>('overview');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<EvidenceVerification | null>(null);

  useEffect(() => {
    if (id) {
      loadAllCaseData(id);
    }
  }, [id]);

  const loadAllCaseData = async (caseId: string) => {
    setLoading(true);
    try {
      const [caseRes, summaryRes, evRes, timelineRes, httpRes, netRes, attackRes] = await Promise.all([
        forensicApi.getCaseById(caseId),
        forensicApi.getSummary(caseId),
        forensicApi.getEvidence(caseId, { size: 50 }),
        forensicApi.getTimeline(caseId, { size: 100 }),
        forensicApi.getHttpEvents(caseId, { size: 50 }),
        forensicApi.getNetworkEvents(caseId, { size: 50 }),
        forensicApi.getAttackEvents(caseId)
      ]);

      if (caseRes) setForensicCase(caseRes);
      if (summaryRes) setSummary(summaryRes);
      if (evRes?.content) setEvidenceList(evRes.content);
      if (timelineRes?.content) setTimelineEvents(timelineRes.content);
      if (httpRes?.content) setHttpEvents(httpRes.content);
      if (netRes?.content) setNetworkEvents(netRes.content);
      if (attackRes) setAttackEvents(attackRes);
    } catch (err) {
      console.error('Failed to load forensic case detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async (evidenceId: string) => {
    setVerifyingId(evidenceId);
    try {
      const res = await forensicApi.verifyEvidence(evidenceId);
      if (res) {
        setVerificationResult(res);
        if (id) loadAllCaseData(id);
      }
    } catch (err) {
      console.error('Failed to verify evidence integrity:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  const getClassBadge = (classification: string) => {
    switch (classification) {
      case 'OBSERVED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">OBSERVED</span>;
      case 'DERIVED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">DERIVED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">INFERRED</span>;
    }
  };

  if (loading || !forensicCase) {
    return <div className="p-8 text-center text-slate-400">Loading forensic investigation workspace...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/forensics')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cases
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">{forensicCase.title}</h1>
            <span className="font-mono text-xs px-2.5 py-1 bg-slate-800 text-cyan-400 border border-slate-700 rounded">
              {forensicCase.caseNumber}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Target: <span className="text-slate-200 font-medium">{forensicCase.targetName}</span>
          </p>
        </div>
      </div>

      {/* Source IP Warning Banner */}
      {!summary?.observedSourceIp ? (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-4 flex items-start gap-3 text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Source IP Notice</h4>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Source IP unavailable from available telemetry. AEGIS strictly refrains from inferring attacker source IP without explicit observed telemetry.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span className="text-slate-400">Observed Source IP:</span>
            <span className="font-mono font-bold text-slate-200">{summary.observedSourceIp}</span>
          </div>
          <span className="text-xs text-slate-400">Origin: <span className="font-mono text-slate-300">{summary.sourceIpOrigin}</span></span>
        </div>
      )}

      {/* Verification Result Modal Banner */}
      {verificationResult && (
        <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-lg p-4 flex items-center justify-between text-emerald-200 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Integrity Status: <strong>{verificationResult.status}</strong> — {verificationResult.message}</span>
          </div>
          <button onClick={() => setVerificationResult(null)} className="text-xs text-emerald-400 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-6">
        {[
          { key: 'overview', label: 'Overview', icon: FileText },
          { key: 'timeline', label: 'Forensic Timeline', icon: Clock },
          { key: 'evidence', label: 'Evidence & Integrity', icon: Hash },
          { key: 'http', label: 'HTTP Telemetry', icon: FileCode },
          { key: 'network', label: 'Network Streams', icon: Network },
          { key: 'reconstruction', label: 'Attack Reconstruction', icon: Activity },
          { key: 'integrity', label: 'SHA-256 Audit', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">Case Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400 text-xs block">Case Status</span>
                <span className="font-semibold text-slate-200">{forensicCase.status}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Priority</span>
                <span className="font-semibold text-slate-200">{forensicCase.priority}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Opened At</span>
                <span className="font-mono text-xs text-slate-300">{new Date(forensicCase.openedAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Investigator</span>
                <span className="text-slate-300">{forensicCase.createdByEmail || 'System'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-2">Factual Findings & Summary</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {summary?.factualFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block font-semibold">Attribution Status:</span>
              <p className="text-xs font-mono text-amber-300/90 mt-1">{summary?.attributionStatus}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Unified Forensic Timeline</h3>
          <div className="space-y-4">
            {timelineEvents.map((ev, idx) => (
              <div key={ev.id} className="flex gap-4 items-start border-l-2 border-slate-800 pl-4 py-1 relative">
                <div className="w-3 h-3 bg-cyan-500 rounded-full absolute -left-[7px] top-2 border-2 border-slate-900" />
                <div className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded p-3 text-sm">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-1">
                    <span>{ev.eventTime ? new Date(ev.eventTime).toISOString() : ev.timeDescription}</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Seq #{ev.sequenceNumber}</span>
                  </div>
                  <h4 className="font-semibold text-slate-200">{ev.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{ev.description}</p>
                  <div className="mt-2 flex gap-3 text-xs text-slate-400">
                    <span>Source: <strong className="text-slate-300">{ev.source}</strong></span>
                    <span>Confidence: <strong className="text-slate-300">{ev.confidence}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Forensic Evidence & Integrity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">SHA-256 Hash</th>
                  <th className="px-4 py-3">Integrity</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {evidenceList.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-semibold text-slate-200">{e.evidenceType}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{e.sourceType}</td>
                    <td className="px-4 py-3">{getClassBadge(e.classification)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-cyan-300">{e.contentHash.substring(0, 16)}...</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {e.integrityStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleVerifyIntegrity(e.id)}
                        disabled={verifyingId === e.id}
                        className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded text-xs transition"
                      >
                        {verifyingId === e.id ? 'Verifying...' : 'Verify SHA-256'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'http' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">HTTP Telemetry Records</h3>
          {httpEvents.length === 0 ? (
            <div className="text-center text-slate-400 py-6">No HTTP telemetry linked to this forensic case.</div>
          ) : (
            <div className="space-y-4">
              {httpEvents.map((h) => (
                <div key={h.id} className="bg-slate-950 border border-slate-800 rounded p-4 text-sm font-mono space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="text-cyan-400 font-bold">{h.method} {h.path}</span>
                    <span>Status: <strong className="text-emerald-400">{h.statusCode || 200}</strong></span>
                  </div>
                  <div className="text-xs text-slate-400">Host: {h.host} | Source IP: {h.sourceIp || 'Unavailable'}</div>
                  {h.requestHeaders && (
                    <div className="text-xs bg-slate-900 p-2 rounded text-slate-300 overflow-x-auto">
                      {h.requestHeaders}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reconstruction' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Attack Event Reconstruction Topology</h3>
          <div className="space-y-4">
            {attackEvents.map((att, idx) => (
              <div key={att.id} className="bg-slate-950 border border-slate-800 rounded p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-cyan-300">{att.stage}</span>
                    {getClassBadge(att.classification)}
                  </div>
                  <p className="text-xs text-slate-300">{att.description || 'Observed telemetry event'}</p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Confidence: <strong className="text-slate-200">{att.confidence}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
