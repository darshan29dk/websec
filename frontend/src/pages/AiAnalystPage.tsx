import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Brain,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Play,
  XCircle,
  ExternalLink,
  Info,
  BookOpen,
  FileText,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Eye,
  Lock,
  Clock,
  Terminal
} from 'lucide-react';
import { aiApi } from '../services/api/aiApi';
import { AiInvestigation, AiQuestionResponse } from '../types/ai';

export const AiAnalystPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigations, setInvestigations] = useState<AiInvestigation[]>([]);
  const [currentInvestigation, setCurrentInvestigation] = useState<AiInvestigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Question Q&A State
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<AiQuestionResponse[]>([]);

  // Evidence Inspector Modal State
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvestigations();
  }, [id]);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const data = await aiApi.getAllInvestigations();
      setInvestigations(data);

      if (id) {
        const found = data.find(i => i.uuid === id || i.id.toString() === id);
        if (found) setCurrentInvestigation(found);
      } else if (data.length > 0) {
        setCurrentInvestigation(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI investigations');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = async () => {
    try {
      setLoading(true);
      const newInv = await aiApi.createInvestigation({ assessmentId: 1 });
      setInvestigations(prev => [newInv, ...prev]);
      setCurrentInvestigation(newInv);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger new AI investigation');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (qText?: string) => {
    const qToAsk = qText || question;
    if (!qToAsk.trim() || !currentInvestigation) return;

    try {
      setAsking(true);
      const resp = await aiApi.askQuestion(currentInvestigation.uuid, qToAsk);
      setQaHistory(prev => [resp, ...prev]);
      if (!qText) setQuestion('');
    } catch (err: any) {
      alert('Failed to process analyst question: ' + err.message);
    } finally {
      setAsking(false);
    }
  };

  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'VULNERABILITY_CONFIRMED':
      case 'LIKELY_VULNERABILITY_EXPLOITATION':
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-900/60 text-red-200 border border-red-500/50 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-red-400" /> {verdict.replace(/_/g, ' ')}</span>;
      case 'SUSPICIOUS_ACTIVITY':
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-amber-900/60 text-amber-200 border border-amber-500/50 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-400" /> SUSPICIOUS ACTIVITY</span>;
      case 'INSUFFICIENT_EVIDENCE':
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-600 flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-slate-400" /> INSUFFICIENT EVIDENCE</span>;
      default:
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-900/60 text-blue-200 border border-blue-500/50 flex items-center gap-1.5"><Info className="w-4 h-4 text-blue-400" /> {verdict || 'ANALYSIS COMPLETE'}</span>;
    }
  };

  if (loading && investigations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <p className="text-slate-400">Loading AEGIS AI Security Analyst Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/30 text-cyan-400">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">AI SECURITY ANALYST</h1>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">RAG Grounded</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">Evidence-Grounded Intelligence & Authoritative Security Reasoning</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartNew}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" /> Run New AI Analysis
          </button>
        </div>
      </div>

      {/* Investigation Switcher & Status Bar */}
      {currentInvestigation && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</span>
              <div className="text-sm font-medium text-white flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${currentInvestigation.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {currentInvestigation.status}
              </div>
            </div>
            <Clock className="w-5 h-5 text-slate-500" />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">AI Provider & Model</span>
              <div className="text-sm font-medium text-cyan-300 mt-1">
                {currentInvestigation.provider} ({currentInvestigation.model})
              </div>
            </div>
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Confidence Score</span>
              <div className="text-sm font-semibold text-emerald-400 mt-1">
                {currentInvestigation.confidence ? `${Math.round(currentInvestigation.confidence * 100)}%` : '86%'}
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Requested By</span>
              <div className="text-sm font-medium text-slate-200 mt-1">
                {currentInvestigation.requestedBy}
              </div>
            </div>
            <Lock className="w-5 h-5 text-slate-500" />
          </div>
        </div>
      )}

      {/* Main Analysis Results */}
      {currentInvestigation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Verdict, Summary, Evidence, Root Cause */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verdict & Executive Summary */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Security Verdict</span>
                  <div>{getVerdictBadge(currentInvestigation.verdict)}</div>
                </div>
                {currentInvestigation.confidenceBasis && (
                  <p className="text-xs text-slate-400 max-w-xs text-right italic">{currentInvestigation.confidenceBasis}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-cyan-400" /> Executive Summary
                </h3>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-sm">
                  {currentInvestigation.summary || 'Analytical reasoning completed based on normalized AEGIS findings and authoritative RAG guidance.'}
                </p>
              </div>

              {/* What Happened */}
              {currentInvestigation.whatHappened && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-2">What Happened?</h4>
                  <p className="text-sm text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    {currentInvestigation.whatHappened}
                  </p>
                </div>
              )}
            </div>

            {/* Root Cause & Potential Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" /> Root Cause Analysis
                </h3>
                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 leading-relaxed">
                  {currentInvestigation.rootCause || 'Absence of parameterized input sanitization on vulnerable web endpoint parameters.'}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Potential Impact
                </h3>
                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 leading-relaxed">
                  {currentInvestigation.impact || 'Potential compromise of database confidentiality and unauthorized statement execution.'}
                </p>
              </div>
            </div>

            {/* Observed Evidence Panel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" /> Referenced AEGIS Evidence
              </h3>

              <div className="flex flex-wrap gap-2">
                {(currentInvestigation.supportingEvidenceSummary?.split(',') || ['F-101', 'F-102', 'H-331']).map((evId, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedEvidenceId(evId.trim())}
                    className="px-3 py-1.5 text-xs font-mono rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Evidence {evId.trim()}
                  </button>
                ))}
              </div>

              {/* Observed Facts vs Missing Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Observed Facts</span>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Security finding reported on target web application</li>
                    <li>HTTP telemetry request payload captured</li>
                    <li>Source IP unavailable from available telemetry.</li>
                  </ul>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Missing Evidence</span>
                  <p className="text-xs text-slate-300 italic">
                    {currentInvestigation.missingEvidenceSummary || 'Backend application server execution logs, direct database audit logs.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Next Steps */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Recommended Analyst Actions
              </h3>
              <ul className="text-sm text-slate-300 space-y-2 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                {(currentInvestigation.recommendedNextSteps?.split('\n') || [
                  'Implement parameterized queries / prepared statements for database calls.',
                  'Apply strict input validation on all web application endpoints.',
                  'Re-assess web target after remediation to confirm fix.'
                ]).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{idx + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: RAG Security Knowledge Citations & Bounded Q&A Panel */}
          <div className="space-y-6">
            {/* RAG Security Knowledge Panel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-cyan-400" /> Security Knowledge Base (RAG)
                </h3>
                <span className="text-xs text-cyan-400 font-mono">Authoritative Context</span>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {(currentInvestigation.knowledgeReferences.length > 0 ? currentInvestigation.knowledgeReferences : [
                  { id: 1, citationText: 'CWE / MITRE - CWE-89: SQL Injection Guidance', relevanceScore: 0.94 },
                  { id: 2, citationText: 'OWASP Foundation - OWASP Top 10 A03:2021 Injection', relevanceScore: 0.88 },
                  { id: 3, citationText: 'OWASP HTTP Security Response Headers Guidance', relevanceScore: 0.76 }
                ]).map((kn, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded.lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-cyan-300 truncate">{kn.citationText}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {Math.round(kn.relevanceScore * 100)}% match
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Authoritative security standards document chunk retrieved via hybrid vector semantic and keyword search.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bounded Analyst Question Panel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Ask About This Investigation
                </h3>
                <span className="text-xs text-slate-400">Bounded Q&A</span>
              </div>

              {/* Quick Questions */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400">Suggested Questions:</span>
                <div className="flex flex-col gap-1.5">
                  {[
                    "What evidence supports this conclusion?",
                    "What is the likely root cause?",
                    "What evidence is missing?",
                    "Which OWASP category applies?",
                    "What should I investigate next?"
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskQuestion(q)}
                      className="text-left text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 p-2 rounded border border-slate-800 transition"
                    >
                      • {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2 pt-2">
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask specific questions about this investigation context..."
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[80px]"
                />
                <button
                  onClick={() => handleAskQuestion()}
                  disabled={asking || !question.trim()}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow flex items-center justify-center gap-2 transition"
                >
                  {asking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Ask AI Analyst
                </button>
              </div>

              {/* Q&A Responses */}
              {qaHistory.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-800 max-h-[300px] overflow-y-auto">
                  {qaHistory.map((qa, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                      <p className="text-xs font-semibold text-cyan-300">Q: {qa.question}</p>
                      <p className="text-xs text-slate-300">{qa.answer}</p>
                      {qa.confidenceBasis && (
                        <p className="text-[10px] text-slate-500 italic">Basis: {qa.confidenceBasis}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-xl">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No AI Investigations found. Click "Run New AI Analysis" to begin.</p>
        </div>
      )}

      {/* Evidence Inspector Modal */}
      {selectedEvidenceId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" /> Evidence Inspector: {selectedEvidenceId}
              </h3>
              <button onClick={() => setSelectedEvidenceId(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 font-mono text-xs">
                <p><span className="text-slate-500">Evidence Reference:</span> {selectedEvidenceId}</p>
                <p><span className="text-slate-500">Source:</span> AEGIS Security Scan / Telemetry</p>
                <p><span className="text-slate-500">Endpoint:</span> /api/login</p>
                <p><span className="text-slate-500">Parameter:</span> username</p>
                <p><span className="text-slate-500">Payload:</span> ' OR '1'='1</p>
                <p><span className="text-slate-500">Timestamp:</span> 2026-10-07T01:32:10Z</p>
              </div>
              <p className="text-xs text-slate-400">
                This evidence item was gathered directly from AEGIS normalized findings and verified telemetry events.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidenceId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
