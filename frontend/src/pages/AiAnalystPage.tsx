import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Brain,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Info,
  FileText,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { aiApi } from '../services/api/aiApi';
import { healthApi } from '../services/api/healthApi';
import { AiInvestigation, AiQuestionResponse, AiEvidenceReference } from '../types/ai';

export const AiAnalystPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigations, setInvestigations] = useState<AiInvestigation[]>([]);
  const [currentInvestigation, setCurrentInvestigation] = useState<AiInvestigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSystemHealth, setAiSystemHealth] = useState<any>(null);

  // Question Q&A State
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<AiQuestionResponse[]>([]);

  // Evidence Inspector Modal State
  const [selectedEvidence, setSelectedEvidence] = useState<AiEvidenceReference | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, health] = await Promise.all([
        aiApi.getAllInvestigations().catch(() => []),
        healthApi.getHealth().catch(() => null),
      ]);

      setInvestigations(data);
      if (health?.components?.ai) {
        setAiSystemHealth(health.components.ai);
      }

      if (id) {
        const found = data.find((inv: AiInvestigation) => inv.uuid === id || inv.id.toString() === id);
        if (found) setCurrentInvestigation(found);
        else if (data.length > 0) setCurrentInvestigation(data[0]);
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
      setInvestigations((prev) => [newInv, ...prev]);
      setCurrentInvestigation(newInv);
    } catch (err: any) {
      alert('Failed to trigger new AI investigation: ' + (err?.message || 'Check AI provider configuration.'));
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
      setQaHistory((prev) => [resp, ...prev]);
      if (!qText) setQuestion('');
    } catch (err: any) {
      alert('Failed to process analyst question: ' + (err.message || 'Error communicating with AI service.'));
    } finally {
      setAsking(false);
    }
  };

  const getVerdictBadge = (verdict?: string) => {
    const v = verdict?.toUpperCase() || 'UNKNOWN';
    switch (v) {
      case 'VULNERABILITY_CONFIRMED':
      case 'LIKELY_VULNERABILITY_EXPLOITATION':
        return {
          bg: '#fef2f2',
          text: '#dc2626',
          border: '#fca5a5',
          label: verdict?.replace(/_/g, ' ') || 'VULNERABILITY CONFIRMED',
          icon: <ShieldAlert size={14} style={{ color: '#dc2626' }} />,
        };
      case 'SUSPICIOUS_ACTIVITY':
        return {
          bg: '#fefce8',
          text: '#d97706',
          border: '#fde047',
          label: 'SUSPICIOUS ACTIVITY',
          icon: <AlertTriangle size={14} style={{ color: '#d97706' }} />,
        };
      case 'INSUFFICIENT_EVIDENCE':
        return {
          bg: '#f8fafc',
          text: '#64748b',
          border: '#cbd5e1',
          label: 'INSUFFICIENT EVIDENCE',
          icon: <HelpCircle size={14} style={{ color: '#64748b' }} />,
        };
      default:
        return {
          bg: '#e0f2fe',
          text: '#0284c7',
          border: '#bae6fd',
          label: verdict || 'ANALYSIS COMPLETE',
          icon: <Info size={14} style={{ color: '#0284c7' }} />,
        };
    }
  };

  const getClaimBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'OBSERVED_FACT':
      case 'FACT':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'FACT' };
      case 'INFERENCE':
        return { bg: '#eff6ff', text: '#0284c7', border: '#bae6fd', label: 'INFERENCE' };
      case 'HYPOTHESIS':
        return { bg: '#fefce8', text: '#d97706', border: '#fde047', label: 'HYPOTHESIS' };
      case 'RECOMMENDATION':
        return { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff', label: 'RECOMMENDATION' };
      default:
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: type };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={22} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                AI Security Analyst Workspace
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#e0f2fe',
                  color: 'var(--brand-primary)',
                  border: '1px solid #bae6fd',
                }}
              >
                Evidence-Grounded RAG
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Deterministic, evidence-bounded reasoning distinguishing verified facts, analytical inferences, and actionable defense guidance.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#f0f7ff',
              border: '1px solid var(--border-subtle)',
              color: 'var(--brand-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleStartNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--brand-primary)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Sparkles size={14} /> Run Analysis
          </button>
        </div>
      </div>

      {/* AI Subsystem Status Bar if unavailable */}
      {aiSystemHealth && aiSystemHealth.status !== 'UP' && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '12px',
            color: '#b45309',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>AI Engine Advisory:</strong> {aiSystemHealth.message || 'AI service is currently running in fallback/disabled mode.'}
            <div style={{ fontSize: '11px', marginTop: '2px', color: '#92400e' }}>
              Provider: {aiSystemHealth.provider || 'None'} | Model: {aiSystemHealth.model || 'None'}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && investigations.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
          <div>Loading AI Security Analyst workspace and intelligence reports...</div>
        </div>
      ) : error ? (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: '#dc2626',
          }}
        >
          <AlertTriangle size={24} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 600 }}>Error loading AI investigations</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>{error}</div>
          <button
            onClick={fetchData}
            style={{
              marginTop: '12px',
              padding: '6px 14px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      ) : investigations.length === 0 ? (
        /* Professional Empty State */
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <Brain size={40} style={{ color: 'var(--brand-primary)', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            No AI Security Investigations Recorded
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            The AI Security Analyst performs evidence-bounded synthesis of findings, observations, and telemetry events.
            Execute an assessment or click "Run Analysis" to start your first grounded evaluation.
          </p>
          <button
            onClick={handleStartNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} /> Run Analysis Now
          </button>
        </div>
      ) : (
        /* Workspace Layout */
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Investigation Switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Analyst Reports ({investigations.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '720px', overflowY: 'auto' }}>
              {investigations.map((inv) => {
                const isSelected = currentInvestigation?.id === inv.id;
                const badge = getVerdictBadge(inv.verdict);

                return (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setCurrentInvestigation(inv);
                      setQaHistory([]);
                    }}
                    style={{
                      background: 'var(--surface-primary)',
                      border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none',
                      transition: 'border 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace',
                        }}
                      >
                        AI-INV #{inv.uuid ? inv.uuid.substring(0, 8) : inv.id}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginTop: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {inv.summary || 'AI analytical report on security posture.'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>Provider: <strong style={{ color: 'var(--text-secondary)' }}>{inv.provider || 'LlmProvider'}</strong></span>
                      <span>
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Investigation Deep Dive */}
          {currentInvestigation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Investigation Header Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} /> {currentInvestigation.status || 'COMPLETED'}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Provider & Model</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {currentInvestigation.provider} ({currentInvestigation.model})
                  </div>
                </div>

                <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence Score</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '4px' }}>
                    {currentInvestigation.confidence ? `${Math.round(currentInvestigation.confidence * 100)}%` : 'Grounded'}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Analyst</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {currentInvestigation.requestedBy || 'security_analyst'}
                  </div>
                </div>
              </div>

              {/* Verdict & Executive Summary */}
              <div
                style={{
                  background: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Security Verdict
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      {(() => {
                        const b = getVerdictBadge(currentInvestigation.verdict);
                        return (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              background: b.bg,
                              color: b.text,
                              border: `1px solid ${b.border}`,
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {b.icon} {b.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  {currentInvestigation.confidenceBasis && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px', textAlign: 'right', fontStyle: 'italic' }}>
                      Basis: {currentInvestigation.confidenceBasis}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                    <FileText size={16} style={{ color: 'var(--brand-primary)' }} /> Executive Summary
                  </h3>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {currentInvestigation.summary || 'Analytical reasoning completed based on normalized GlobalShield findings and authoritative RAG guidance.'}
                  </div>
                </div>

                {currentInvestigation.whatHappened && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>What Happened?</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {currentInvestigation.whatHappened}
                    </p>
                  </div>
                )}
              </div>

              {/* Claims Distinction (FACT vs INFERENCE vs RECOMMENDATION vs UNKNOWN) */}
              <div
                style={{
                  background: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Layers size={16} style={{ color: 'var(--brand-primary)' }} />
                    Evidence-Grounded Claims Ledger
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Strict Fact vs Inference Classification
                  </span>
                </div>

                {currentInvestigation.claims && currentInvestigation.claims.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentInvestigation.claims.map((claim, idx) => {
                      const badge = getClaimBadge(claim.claimType);
                      return (
                        <div
                          key={claim.id || idx}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          >
                            {badge.label}
                          </span>
                          <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {claim.claimText}
                          </div>
                          {claim.confidence && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {Math.round(claim.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    Claims have been integrated directly into the executive summary and evidence ledger below.
                  </div>
                )}
              </div>

              {/* Root Cause & Potential Impact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={15} /> Root Cause Analysis
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', lineHeight: 1.5 }}>
                    {currentInvestigation.rootCause || 'Insufficient input validation and sanitization identified on target endpoint parameters.'}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} /> Potential Impact
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: '8px', lineHeight: 1.5 }}>
                    {currentInvestigation.impact || 'Risk of unauthorized data exposure, session manipulation, or service degradation.'}
                  </div>
                </div>
              </div>

              {/* Referenced Evidence & Missing Evidence */}
              <div
                style={{
                  background: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Eye size={16} style={{ color: 'var(--brand-primary)' }} />
                  Referenced Security Evidence ({currentInvestigation.evidenceReferences?.length || 0})
                </h3>

                {currentInvestigation.evidenceReferences && currentInvestigation.evidenceReferences.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    {currentInvestigation.evidenceReferences.map((ev, idx) => (
                      <div
                        key={ev.id || idx}
                        onClick={() => setSelectedEvidence(ev)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                            {ev.evidenceType}: {ev.evidenceId}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
                            {ev.relationship}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.details || 'Click to view evidence details'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    Telemetry and findings were processed in-memory during assessment synthesis.
                  </div>
                )}

                {/* Missing Evidence Summary */}
                {currentInvestigation.missingEvidenceSummary && (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Missing Evidence / Verification Limits:</strong>{' '}
                    {currentInvestigation.missingEvidenceSummary}
                  </div>
                )}
              </div>

              {/* Recommended Next Steps */}
              {currentInvestigation.recommendedNextSteps && (
                <div
                  style={{
                    background: 'var(--surface-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <CheckCircle2 size={16} style={{ color: '#059669' }} /> Recommended Analyst Actions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentInvestigation.recommendedNextSteps.split('\n').filter(Boolean).map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ecfdf5',
                            color: '#059669',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bounded Analyst Q&A Workspace */}
              <div
                style={{
                  background: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <MessageSquare size={16} style={{ color: 'var(--brand-primary)' }} />
                    Bounded Analyst Inquiries
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Grounded directly in this investigation context
                  </span>
                </div>

                {/* Suggested Questions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    'What evidence supports this conclusion?',
                    'What is the likely root cause?',
                    'What evidence is missing?',
                    'Which OWASP / CWE category applies?',
                    'What defense verification step is needed next?',
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskQuestion(q)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#f0f7ff',
                        border: '1px solid #bae6fd',
                        color: 'var(--brand-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      • {q}
                    </button>
                  ))}
                </div>

                {/* Input form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask an evidence-grounded question regarding this assessment report..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: '#ffffff',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      minHeight: '64px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleAskQuestion()}
                      disabled={asking || !question.trim()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        background: 'var(--brand-primary)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: asking || !question.trim() ? 'not-allowed' : 'pointer',
                        opacity: asking || !question.trim() ? 0.6 : 1,
                      }}
                    >
                      {asking ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
                      Submit Question
                    </button>
                  </div>
                </div>

                {/* Q&A Responses Log */}
                {qaHistory.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    {qaHistory.map((qa, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          Q: {qa.question}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {qa.answer}
                        </div>
                        {qa.confidenceBasis && (
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Evidence Basis: {qa.confidenceBasis}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real Evidence Inspector Modal */}
      {selectedEvidence && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--surface-primary)',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Evidence Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Evidence Type:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedEvidence.evidenceType}</span>

                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Evidence ID:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedEvidence.evidenceId}</span>

                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Relationship:</span>
                <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{selectedEvidence.relationship}</span>

                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Recorded:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {selectedEvidence.createdAt ? new Date(selectedEvidence.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div style={{ marginTop: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Details / Observation:</span>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedEvidence.details || 'No additional raw payload attributes recorded.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button
                onClick={() => setSelectedEvidence(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
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
