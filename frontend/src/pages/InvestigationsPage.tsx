import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investigationApi } from '../services/api/investigationApi';
import {
  Investigation,
  InvestigationHypothesis,
  InvestigationEvidence,
  InvestigationNote,
  TimelineEvent,
  InvestigationStatus,
  HypothesisStatus,
  InvestigationConclusion
} from '../types/investigation';
import { FileSearch, MessageSquare, Plus, CheckCircle2, AlertCircle, HelpCircle, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';

export const InvestigationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigationsList, setInvestigationsList] = useState<Investigation[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(id || null);

  const [investigationData, setInvestigationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newHypothesisStatement, setNewHypothesisStatement] = useState('');
  const [newEvidenceDescription, setNewEvidenceDescription] = useState('');
  const [newEvidenceType, setNewEvidenceType] = useState('LOG_EVENT');
  const [newEvidenceSource, setNewEvidenceSource] = useState('TELEMETRY');

  const [selectedConclusion, setSelectedConclusion] = useState<InvestigationConclusion | ''>('');

  useEffect(() => {
    loadInvestigationsList();
  }, []);

  useEffect(() => {
    if (selectedInvId) {
      loadInvestigationDetail(selectedInvId);
    }
  }, [selectedInvId]);

  const loadInvestigationsList = async () => {
    try {
      const res = await investigationApi.getInvestigations(0, 50);
      if (res.success && res.data) {
        setInvestigationsList(res.data.content);
        if (!selectedInvId && res.data.content.length > 0) {
          setSelectedInvId(res.data.content[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load investigations list', err);
    }
  };

  const loadInvestigationDetail = async (invId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await investigationApi.getInvestigationById(invId);
      if (res.success && res.data) {
        setInvestigationData(res.data);
        if (res.data.investigation.conclusion) {
          setSelectedConclusion(res.data.investigation.conclusion);
        }
      }
    } catch (err: any) {
      setError('Failed to load investigation details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !newNoteContent.trim()) return;
    try {
      await investigationApi.addNote(selectedInvId, newNoteContent.trim());
      setNewNoteContent('');
      loadInvestigationDetail(selectedInvId);
    } catch (err: any) {
      alert('Failed to add note');
    }
  };

  const handleAddHypothesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !newHypothesisStatement.trim()) return;
    try {
      await investigationApi.addHypothesis(selectedInvId, newHypothesisStatement.trim());
      setNewHypothesisStatement('');
      loadInvestigationDetail(selectedInvId);
    } catch (err: any) {
      alert('Failed to propose hypothesis');
    }
  };

  const handleUpdateHypothesisStatus = async (hypId: string, status: HypothesisStatus) => {
    if (!selectedInvId) return;
    try {
      await investigationApi.updateHypothesisStatus(hypId, status);
      loadInvestigationDetail(selectedInvId);
    } catch (err: any) {
      alert('Failed to update hypothesis status');
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !newEvidenceDescription.trim()) return;
    try {
      await investigationApi.addEvidence(selectedInvId, {
        evidenceType: newEvidenceType,
        sourceType: newEvidenceSource,
        sourceId: 'MANUAL_REF_' + Date.now(),
        description: newEvidenceDescription.trim(),
        confidence: 'HIGH'
      });
      setNewEvidenceDescription('');
      loadInvestigationDetail(selectedInvId);
    } catch (err: any) {
      alert('Failed to attach evidence');
    }
  };

  const handleUpdateConclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !selectedConclusion) return;
    try {
      await investigationApi.updateStatus(selectedInvId, 'COMPLETED', selectedConclusion);
      loadInvestigationDetail(selectedInvId);
      loadInvestigationsList();
    } catch (err: any) {
      alert('Failed to conclude investigation');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSearch size={24} style={{ color: 'var(--accent-primary)' }} /> Investigation Workspace
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Structured evidence-based hypothesis testing, analyst audit notes, and investigation conclusions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Left column: Investigations selector */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 12px 0' }}>
            Active Workspace Cases
          </h3>
          {investigationsList.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No investigations created yet. Open an investigation from an incident detail page.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {investigationsList.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvId(inv.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: selectedInvId === inv.id ? 'var(--bg-dark)' : 'transparent',
                    border: selectedInvId === inv.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                    Case #{inv.id.substring(0, 8)}...
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Status: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Workspace Details */}
        <div>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading investigation workspace...</div>
          ) : !investigationData ? (
            <div style={{ padding: '32px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select an investigation case from the left panel.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Top Banner & Conclusion control */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      Status: {investigationData.investigation.status}
                    </span>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', margin: '4px 0 0 0' }}>
                      {investigationData.investigation.primaryHypothesis || 'Investigation Case'}
                    </h2>
                  </div>

                  <form onSubmit={handleUpdateConclusion} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={selectedConclusion}
                      onChange={(e) => setSelectedConclusion(e.target.value as InvestigationConclusion)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--bg-dark)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-heading)',
                        fontSize: '12px',
                      }}
                    >
                      <option value="">Select Conclusion</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="LIKELY">LIKELY</option>
                      <option value="SUSPICIOUS">SUSPICIOUS</option>
                      <option value="INCONCLUSIVE">INCONCLUSIVE</option>
                      <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!selectedConclusion}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Conclude Case
                    </button>
                  </form>
                </div>
              </div>

              {/* Hypotheses Management */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 16px 0' }}>
                  Investigation Hypotheses
                </h3>

                <form onSubmit={handleAddHypothesis} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Propose a new hypothesis statement..."
                    value={newHypothesisStatement}
                    onChange={(e) => setNewHypothesisStatement(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-heading)',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'var(--accent-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Propose
                  </button>
                </form>

                {investigationData.hypotheses.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No hypotheses proposed yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {investigationData.hypotheses.map((h: InvestigationHypothesis) => (
                      <div key={h.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>{h.statement}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Proposed by {h.createdBy} | Status: <strong style={{ color: 'var(--accent-primary)' }}>{h.status}</strong></div>
                        </div>

                        <select
                          value={h.status}
                          onChange={(e) => handleUpdateHypothesisStatus(h.id, e.target.value as HypothesisStatus)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-heading)',
                            fontSize: '11px',
                          }}
                        >
                          <option value="PROPOSED">PROPOSED</option>
                          <option value="SUPPORTED">SUPPORTED</option>
                          <option value="PARTIALLY_SUPPORTED">PARTIALLY_SUPPORTED</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="INCONCLUSIVE">INCONCLUSIVE</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidence Attachment */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 16px 0' }}>
                  Evidence Artifacts ({investigationData.evidence.length})
                </h3>

                <form onSubmit={handleAddEvidence} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Evidence description or observation..."
                    value={newEvidenceDescription}
                    onChange={(e) => setNewEvidenceDescription(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-heading)',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'var(--accent-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Attach Evidence
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {investigationData.evidence.map((ev: InvestigationEvidence) => (
                    <div key={ev.id} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', fontSize: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{ev.description}</div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Type: {ev.evidenceType} | Confidence: {ev.confidence}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analyst Notes */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 16px 0' }}>
                  Analyst Audit Notes ({investigationData.notes.length})
                </h3>

                <form onSubmit={handleAddNote} style={{ marginBottom: '16px' }}>
                  <textarea
                    placeholder="Record investigation findings or audit note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-heading)',
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'var(--accent-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Post Note
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {investigationData.notes.map((n: InvestigationNote) => (
                    <div key={n.id} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{n.authorEmail}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-heading)' }}>{n.content}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
