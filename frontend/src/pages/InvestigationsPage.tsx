import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { investigationApi } from '../services/api/investigationApi';
import { incidentApi } from '../services/api/incidentApi';
import {
  Investigation,
  InvestigationHypothesis,
  InvestigationEvidence,
  InvestigationNote,
  TimelineEvent,
  InvestigationStatus,
  HypothesisStatus,
  InvestigationConclusion,
} from '../types/investigation';
import { SecurityIncident } from '../types/incident';
import {
  FileSearch,
  MessageSquare,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FolderGit2,
  ExternalLink,
  Target as TargetIcon,
  Activity,
  Layers,
  Lock,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';

export const InvestigationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigationsList, setInvestigationsList] = useState<Investigation[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(id || null);

  const [investigationData, setInvestigationData] = useState<{
    investigation: Investigation;
    notes: InvestigationNote[];
    hypotheses: InvestigationHypothesis[];
    evidence: InvestigationEvidence[];
    timeline: TimelineEvent[];
  } | null>(null);

  const [relatedIncident, setRelatedIncident] = useState<SecurityIncident | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newHypothesisStatement, setNewHypothesisStatement] = useState('');
  const [newEvidenceDescription, setNewEvidenceDescription] = useState('');
  const [newEvidenceType, setNewEvidenceType] = useState('LOG_EVENT');
  const [newEvidenceSource, setNewEvidenceSource] = useState('SECURITY_EVENT');

  const [selectedConclusion, setSelectedConclusion] = useState<InvestigationConclusion | ''>('');

  useEffect(() => {
    loadInvestigationsList();
  }, []);

  useEffect(() => {
    if (id) {
      setSelectedInvId(id);
    }
  }, [id]);

  useEffect(() => {
    if (selectedInvId) {
      loadInvestigationDetail(selectedInvId);
    }
  }, [selectedInvId]);

  const loadInvestigationsList = async () => {
    try {
      const res = await investigationApi.getInvestigations(0, 50);
      const list = res?.content || (Array.isArray(res) ? res : []);
      setInvestigationsList(list);
      if (!selectedInvId && list.length > 0) {
        setSelectedInvId(list[0].id);
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
      // Handles both direct object and body.data
      const data = (res && res.data) ? res.data : res;
      if (data && data.investigation) {
        setInvestigationData(data);
        if (data.investigation.conclusion) {
          setSelectedConclusion(data.investigation.conclusion);
        }

        // Fetch related incident if incidentId is available
        if (data.investigation.incidentId) {
          try {
            const inc = await incidentApi.getIncidentById(data.investigation.incidentId);
            setRelatedIncident(inc);
          } catch {
            setRelatedIncident(null);
          }
        }
      } else {
        setError('Investigation data format invalid.');
      }
    } catch {
      setError('Failed to load investigation details.');
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
    } catch {
      alert('Failed to add analyst note.');
    }
  };

  const handleAddHypothesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !newHypothesisStatement.trim()) return;
    try {
      await investigationApi.addHypothesis(selectedInvId, newHypothesisStatement.trim());
      setNewHypothesisStatement('');
      loadInvestigationDetail(selectedInvId);
    } catch {
      alert('Failed to propose hypothesis.');
    }
  };

  const handleUpdateHypothesisStatus = async (hypId: string, status: HypothesisStatus) => {
    if (!selectedInvId) return;
    try {
      await investigationApi.updateHypothesisStatus(hypId, status);
      loadInvestigationDetail(selectedInvId);
    } catch {
      alert('Failed to update hypothesis status.');
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !newEvidenceDescription.trim()) return;
    try {
      await investigationApi.addEvidence(selectedInvId, {
        evidenceType: newEvidenceType,
        sourceType: newEvidenceSource,
        sourceId: 'EV_' + Date.now(),
        description: newEvidenceDescription.trim(),
        evidencePayload: JSON.stringify({ recordedAt: new Date().toISOString() }),
      });
      setNewEvidenceDescription('');
      loadInvestigationDetail(selectedInvId);
    } catch {
      alert('Failed to attach evidence.');
    }
  };

  const handleUpdateConclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !selectedConclusion) return;
    try {
      await investigationApi.updateStatus(selectedInvId, 'COMPLETED', selectedConclusion as InvestigationConclusion);
      loadInvestigationDetail(selectedInvId);
      loadInvestigationsList();
    } catch {
      alert('Failed to record investigation conclusion.');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-heading)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <FileSearch size={22} color="var(--accent-primary)" /> Investigation Workspace
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Structured evidence-based hypothesis testing, analyst audit notes, and investigation conclusions
        </p>
      </div>

      {investigationsList.length === 0 && !isLoading ? (
        /* PROFESSIONAL EMPTY STATE (Requirement 7) */
        <div
          style={{
            padding: '60px 20px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            textAlign: 'center',
            maxWidth: '640px',
            margin: '40px auto',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FileSearch size={28} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
            No Active Investigations
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
            Investigations are created from detected security events or incidents to test hypotheses, correlate evidence, and formalize security root-cause conclusions.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Button variant="primary" onClick={() => navigate('/incidents')}>
              View Incidents to Investigate
            </Button>
            <Button variant="secondary" onClick={() => navigate('/findings')}>
              Inspect Security Findings
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* Left column: Investigations selector */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              height: 'fit-content',
            }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 12px 0' }}>
              Active Workspace Cases ({investigationsList.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {investigationsList.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvId(inv.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: selectedInvId === inv.id ? 'var(--accent-light)' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedInvId === inv.id ? 'var(--accent-primary)' : 'var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                      Case #{inv.id.substring(0, 8)}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Created: {new Date(inv.createdAt).toLocaleDateString()}
                  </div>
                  {inv.primaryHypothesis && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-main)',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {inv.primaryHypothesis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Workspace Details */}
          <div>
            {isLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading investigation workspace...
              </div>
            ) : !investigationData ? (
              <div
                style={{
                  padding: '32px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                Select an investigation case from the left panel.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* INVESTIGATION HEADER & CONCLUSION */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          Case ID: {investigationData.investigation.id}
                        </span>
                        <StatusBadge status={investigationData.investigation.status} />
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#e0f2fe',
                            color: '#0284c7',
                          }}
                        >
                          Confidence: {investigationData.investigation.confidence}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', margin: '6px 0 0 0' }}>
                        {investigationData.investigation.primaryHypothesis || 'Security Incident Investigation'}
                      </h2>
                    </div>

                    {/* Conclusion Selector */}
                    <form onSubmit={handleUpdateConclusion} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        value={selectedConclusion}
                        onChange={(e) => setSelectedConclusion(e.target.value as InvestigationConclusion)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontSize: '12px',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-main)',
                        }}
                      >
                        <option value="">Select Formal Conclusion...</option>
                        <option value="CONFIRMED_TRUE_POSITIVE">Confirmed True Positive</option>
                        <option value="FALSE_POSITIVE">False Positive</option>
                        <option value="BENIGN_ANOMALY">Benign Anomaly</option>
                        <option value="INCONCLUSIVE">Inconclusive</option>
                        <option value="SECURITY_DRIFT">Security Baseline Drift</option>
                      </select>
                      <Button variant="primary" size="sm" type="submit" disabled={!selectedConclusion}>
                        Record Decision
                      </Button>
                    </form>
                  </div>

                  {/* RELATIONSHIP GRAPH CHIPS (Requirement 7 & 19) */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '11.5px',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px' }}>
                      Correlated Entity Chain:
                    </span>
                    {relatedIncident?.targetId && (
                      <Link
                        to={`/targets/${relatedIncident.targetId}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-color)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        <TargetIcon size={12} color="var(--accent-primary)" /> Target: #{relatedIncident.targetId.substring(0, 8)}
                      </Link>
                    )}
                    {relatedIncident?.id && (
                      <Link
                        to={`/incidents/${relatedIncident.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-color)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          color: '#dc2626',
                        }}
                      >
                        <AlertTriangle size={12} color="#dc2626" /> Incident #{relatedIncident.id.substring(0, 8)}
                      </Link>
                    )}
                    <Link
                      to={`/forensics`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      <FolderGit2 size={12} color="var(--accent-primary)" /> Digital Forensics
                    </Link>
                  </div>
                </div>

                {/* INVESTIGATION SUMMARY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Hypotheses Testing Section */}
                  <Card
                    title="Analyst Hypotheses"
                    subtitle="Competing explanations evaluated against collected evidence"
                    style={{ height: 'fit-content' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(!investigationData.hypotheses || investigationData.hypotheses.length === 0) ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          No hypotheses proposed yet.
                        </p>
                      ) : (
                        investigationData.hypotheses.map((hyp) => (
                          <div
                            key={hyp.id}
                            style={{
                              padding: '12px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-heading)' }}>
                                {hyp.statement}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor:
                                    hyp.status === 'SUPPORTED' ? '#ecfdf5' : hyp.status === 'REJECTED' ? '#fef2f2' : '#fffbeb',
                                  color:
                                    hyp.status === 'SUPPORTED' ? '#047857' : hyp.status === 'REJECTED' ? '#b91c1c' : '#b45309',
                                }}
                              >
                                {hyp.status}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                              <Button
                                size="sm"
                                variant={hyp.status === 'SUPPORTED' ? 'primary' : 'secondary'}
                                onClick={() => handleUpdateHypothesisStatus(hyp.id, 'SUPPORTED')}
                              >
                                Support
                              </Button>
                              <Button
                                size="sm"
                                variant={hyp.status === 'REJECTED' ? 'danger' : 'secondary'}
                                onClick={() => handleUpdateHypothesisStatus(hyp.id, 'REJECTED')}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))
                      )}

                      <form onSubmit={handleAddHypothesis} style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Propose security hypothesis..."
                            value={newHypothesisStatement}
                            onChange={(e) => setNewHypothesisStatement(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              fontSize: '12px',
                            }}
                          />
                          <Button size="sm" variant="primary" type="submit" disabled={!newHypothesisStatement.trim()}>
                            Propose
                          </Button>
                        </div>
                      </form>
                    </div>
                  </Card>

                  {/* Case Notes */}
                  <Card
                    title="Analyst Notes &amp; Observations"
                    subtitle="Audit trail of manual review and correlation actions"
                    style={{ height: 'fit-content' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(!investigationData.notes || investigationData.notes.length === 0) ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No notes recorded.</p>
                      ) : (
                        investigationData.notes.map((note) => (
                          <div
                            key={note.id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                            }}
                          >
                            <div style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                              {note.content}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                marginTop: '6px',
                              }}
                            >
                              <span>Analyst: {note.authorEmail || 'Operator'}</span>
                              <span>{new Date(note.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}

                      <form onSubmit={handleAddNote} style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Add analyst note..."
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              fontSize: '12px',
                            }}
                          />
                          <Button size="sm" variant="primary" type="submit" disabled={!newNoteContent.trim()}>
                            Add Note
                          </Button>
                        </div>
                      </form>
                    </div>
                  </Card>
                </div>

                {/* EVIDENCE & TIMELINE TABS (Requirement 7) */}
                <Card
                  title="Evidence &amp; Chronological Event Timeline"
                  subtitle="Correlated security telemetry, HTTP headers, WAF signals, and event timeline"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Evidence List */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Attached Evidence Artifacts ({investigationData.evidence?.length || 0})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                        {(!investigationData.evidence || investigationData.evidence.length === 0) ? (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            No evidence items attached yet.
                          </p>
                        ) : (
                          investigationData.evidence.map((ev) => (
                            <div
                              key={ev.id}
                              style={{
                                padding: '10px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '12px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                                  {ev.evidenceType}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                  Source: {ev.sourceType}
                                </span>
                              </div>
                              <div style={{ color: 'var(--text-main)', marginTop: '4px', fontSize: '11.5px' }}>
                                {ev.description}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Evidence Form */}
                      <form onSubmit={handleAddEvidence} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <select
                            value={newEvidenceType}
                            onChange={(e) => setNewEvidenceType(e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              fontSize: '11px',
                            }}
                          >
                            <option value="LOG_EVENT">Log Event</option>
                            <option value="HTTP_REQUEST">HTTP Request</option>
                            <option value="WAF_BLOCK">WAF Block</option>
                            <option value="SCAN_OBSERVATION">Scan Observation</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Evidence description..."
                            value={newEvidenceDescription}
                            onChange={(e) => setNewEvidenceDescription(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              fontSize: '11px',
                            }}
                          />
                          <Button size="sm" variant="primary" type="submit" disabled={!newEvidenceDescription.trim()}>
                            Attach
                          </Button>
                        </div>
                      </form>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Chronological Event Timeline ({investigationData.timeline?.length || 0})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                        {(!investigationData.timeline || investigationData.timeline.length === 0) ? (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            No timeline events recorded.
                          </p>
                        ) : (
                          investigationData.timeline.map((item, index) => (
                            <div
                              key={item.id || index}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '8px 10px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                              }}
                            >
                              <Clock size={14} color="var(--accent-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                                    {item.title || item.eventType || 'Event'}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    {new Date(item.eventTime).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {item.description}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
