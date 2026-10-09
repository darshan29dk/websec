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
  InvestigationConclusion,
  HypothesisStatus,
} from '../types/investigation';
import { SecurityIncident } from '../types/incident';
import {
  ArrowLeft,
  FileSearch,
  MessageSquare,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldAlert,
  FolderGit2,
  ExternalLink,
  Target as TargetIcon,
  Activity,
  Layers,
  Lock,
  Hash,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigationData, setInvestigationData] = useState<{
    investigation: Investigation;
    notes: InvestigationNote[];
    hypotheses: InvestigationHypothesis[];
    evidence: InvestigationEvidence[];
    timeline: TimelineEvent[];
  } | null>(null);

  const [relatedIncident, setRelatedIncident] = useState<SecurityIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Form states
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const [newHypothesisStatement, setNewHypothesisStatement] = useState('');
  const [isSubmittingHypothesis, setIsSubmittingHypothesis] = useState(false);

  const [newEvidenceDescription, setNewEvidenceDescription] = useState('');
  const [newEvidenceType, setNewEvidenceType] = useState('LOG_EVENT');
  const [newEvidenceSource, setNewEvidenceSource] = useState('SECURITY_EVENT');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  const [selectedConclusion, setSelectedConclusion] = useState<InvestigationConclusion | ''>('');
  const [isUpdatingConclusion, setIsUpdatingConclusion] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvestigationDetail(id);
    }
  }, [id]);

  const loadInvestigationDetail = async (invId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await investigationApi.getInvestigationById(invId);
      setInvestigationData(res);
      if (res.investigation.conclusion) {
        setSelectedConclusion(res.investigation.conclusion);
      }

      if (res.investigation.incidentId) {
        try {
          const inc = await incidentApi.getIncidentById(res.investigation.incidentId);
          setRelatedIncident(inc);
        } catch {
          // Incident might be archived or mock
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load investigation details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNoteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await investigationApi.addNote(id, newNoteContent.trim());
      setNewNoteContent('');
      setActionSuccess('Analyst note saved successfully.');
      setTimeout(() => setActionSuccess(''), 4000);
      loadInvestigationDetail(id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAddHypothesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newHypothesisStatement.trim()) return;

    setIsSubmittingHypothesis(true);
    try {
      await investigationApi.addHypothesis(id, newHypothesisStatement.trim());
      setNewHypothesisStatement('');
      setActionSuccess('Investigation hypothesis proposed.');
      setTimeout(() => setActionSuccess(''), 4000);
      loadInvestigationDetail(id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add hypothesis');
    } finally {
      setIsSubmittingHypothesis(false);
    }
  };

  const handleUpdateHypothesisStatus = async (hypId: string, status: HypothesisStatus) => {
    try {
      await investigationApi.updateHypothesisStatus(hypId, status);
      if (id) loadInvestigationDetail(id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update hypothesis status');
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newEvidenceDescription.trim()) return;

    setIsSubmittingEvidence(true);
    try {
      await investigationApi.addEvidence(id, {
        evidenceType: newEvidenceType,
        sourceType: newEvidenceSource,
        sourceId: id,
        description: newEvidenceDescription.trim(),
        observedAt: new Date().toISOString(),
        confidence: 'MEDIUM',
      });
      setNewEvidenceDescription('');
      setActionSuccess('Forensic evidence registered into custody.');
      setTimeout(() => setActionSuccess(''), 4000);
      loadInvestigationDetail(id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add evidence');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleSaveConclusion = async () => {
    if (!id || !selectedConclusion) return;
    setIsUpdatingConclusion(true);
    try {
      await investigationApi.concludeInvestigation(id, selectedConclusion);
      setActionSuccess(`Investigation conclusion finalized as ${selectedConclusion}.`);
      setTimeout(() => setActionSuccess(''), 4000);
      loadInvestigationDetail(id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to conclude investigation');
    } finally {
      setIsUpdatingConclusion(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading investigation record...</p>
      </div>
    );
  }

  if (error && !investigationData) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Button variant="outline" onClick={() => navigate('/investigations')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Investigations
        </Button>
        <Alert type="error" title="Investigation Error" message={error} />
      </div>
    );
  }

  const { investigation, notes, hypotheses, evidence, timeline } = investigationData!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      {/* Navigation & Header */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/investigations')}
          style={{ marginBottom: 12, paddingLeft: 0, color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back to Investigations
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Investigation <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-primary)' }}>#{investigation.id.substring(0, 8)}</span>
              </h1>
              <StatusBadge status={investigation.status} />
              {investigation.conclusion && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  Conclusion: {investigation.conclusion}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
              UUID: {investigation.uuid} | Created by {investigation.createdBy} on {new Date(investigation.createdAt).toLocaleString()}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={`/ai/investigations/${investigation.id}`}>
              <Button variant="secondary" size="sm">
                <Sparkles size={14} style={{ marginRight: 6 }} /> AI Analyst Review
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <Alert type="success" title="Success" message={actionSuccess} />
      )}

      {error && (
        <Alert type="error" title="Error" message={error} />
      )}

      {/* Primary Investigation Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Incident Link Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-muted)' }}>
            <ShieldAlert size={16} />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Parent Security Incident</span>
          </div>
          {relatedIncident ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)' }}>
                  {relatedIncident.title}
                </span>
                <StatusBadge status={relatedIncident.severity} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                {relatedIncident.description || 'Associated operational security incident requiring investigation.'}
              </p>
              <Link to={`/incidents/${relatedIncident.id}`}>
                <Button variant="outline" size="sm" style={{ width: '100%' }}>
                  <ExternalLink size={14} style={{ marginRight: 6 }} /> View Incident #{relatedIncident.id.substring(0, 8)}
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Incident ID: <code style={{ fontFamily: 'monospace' }}>{investigation.incidentId}</code>
              </p>
              <Link to={`/incidents/${investigation.incidentId}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink size={14} style={{ marginRight: 6 }} /> View Incident Record
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Primary Hypothesis Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-muted)' }}>
            <FileSearch size={16} />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Primary Working Hypothesis</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-main)', margin: '0 0 12px 0', minHeight: 48 }}>
            {investigation.primaryHypothesis || 'No primary hypothesis formalized yet. Review hypotheses below to establish consensus.'}
          </p>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Confidence: <strong style={{ color: 'var(--text-main)' }}>{investigation.confidence}</strong></span>
            <span>Total Hypotheses: <strong style={{ color: 'var(--text-main)' }}>{hypotheses.length}</strong></span>
          </div>
        </Card>

        {/* Conclusion / Case Disposition */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-muted)' }}>
            <CheckCircle2 size={16} />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Case Disposition</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={selectedConclusion}
                onChange={(e) => setSelectedConclusion(e.target.value as InvestigationConclusion)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: 13,
                }}
              >
                <option value="">Select Conclusion</option>
                <option value="CONFIRMED">CONFIRMED (Evidence Conclusive)</option>
                <option value="LIKELY">LIKELY (Strong Telemetry)</option>
                <option value="SUSPICIOUS">SUSPICIOUS (Anomalous Activity)</option>
                <option value="INCONCLUSIVE">INCONCLUSIVE (Insufficient Evidence)</option>
                <option value="FALSE_POSITIVE">FALSE_POSITIVE (Benign Action)</option>
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveConclusion}
                disabled={!selectedConclusion || isUpdatingConclusion}
              >
                {isUpdatingConclusion ? 'Saving...' : 'Finalize'}
              </Button>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Finalizing conclusion updates the case disposition and informs defensive posture metrics.
            </p>
          </div>
        </Card>
      </div>

      {/* Main Workspace: Hypotheses & Evidence Locker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Hypotheses Column */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Hypotheses Evaluation</h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hypotheses.length} registered</span>
          </div>

          <form onSubmit={handleAddHypothesis} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Propose a working security hypothesis..."
              value={newHypothesisStatement}
              onChange={(e) => setNewHypothesisStatement(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: 13,
              }}
            />
            <Button variant="secondary" size="sm" type="submit" disabled={isSubmittingHypothesis || !newHypothesisStatement.trim()}>
              <Plus size={14} style={{ marginRight: 4 }} /> Add
            </Button>
          </form>

          {hypotheses.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No hypotheses proposed yet. Propose an explanation above.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hypotheses.map((hyp) => (
                <div
                  key={hyp.id}
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                      {hyp.statement}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 600,
                        backgroundColor:
                          hyp.status === 'SUPPORTED'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : hyp.status === 'REJECTED'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(156, 163, 175, 0.2)',
                        color:
                          hyp.status === 'SUPPORTED'
                            ? '#34d399'
                            : hyp.status === 'REJECTED'
                            ? '#f87171'
                            : 'var(--text-muted)',
                      }}
                    >
                      {hyp.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>By {hyp.createdBy}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleUpdateHypothesisStatus(hyp.id, 'SUPPORTED')}
                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: 11 }}
                      >
                        Support
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => handleUpdateHypothesisStatus(hyp.id, 'REJECTED')}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}
                      >
                        Reject
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => handleUpdateHypothesisStatus(hyp.id, 'INCONCLUSIVE')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
                      >
                        Inconclusive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Evidence Locker Column */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Forensic Evidence Locker</h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{evidence.length} items verified</span>
          </div>

          <form onSubmit={handleAddEvidence} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={newEvidenceType}
                onChange={(e) => setNewEvidenceType(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: 12,
                }}
              >
                <option value="LOG_EVENT">LOG_EVENT</option>
                <option value="PACKET_CAPTURE">PACKET_CAPTURE (PCAP)</option>
                <option value="NETWORK_FLOW">NETWORK_FLOW</option>
                <option value="MEMORY_DUMP">MEMORY_DUMP</option>
                <option value="DISK_IMAGE">DISK_IMAGE</option>
                <option value="IDS_ALERT">IDS_ALERT</option>
              </select>
              <input
                type="text"
                placeholder="Evidence description or artifact reference..."
                value={newEvidenceDescription}
                onChange={(e) => setNewEvidenceDescription(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: 12,
                }}
              />
              <Button variant="secondary" size="sm" type="submit" disabled={isSubmittingEvidence || !newEvidenceDescription.trim()}>
                Register
              </Button>
            </div>
          </form>

          {evidence.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No forensic evidence items stored in this case.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {evidence.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {ev.evidenceType}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(ev.observedAt || ev.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                    {ev.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <Hash size={12} />
                    <span>Integrity:</span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-main)' }}>
                      {ev.integrityHash ? ev.integrityHash.substring(0, 16) + '...' : 'SHA-256 Calculated on Ingestion'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Timeline & Analyst Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {/* Timeline Events */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Correlated Event Timeline</h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeline.length} events</span>
          </div>

          {timeline.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No correlated timeline events recorded yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '2px solid var(--border-color)', paddingLeft: 16, marginLeft: 8 }}>
              {timeline.map((event) => (
                <div key={event.id} style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -22,
                      top: 4,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                    {new Date(event.eventTime).toLocaleString()} &bull; Source: {event.source}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                    {event.title}
                  </div>
                  {event.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {event.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Analyst Notes */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Analyst Investigation Notes</h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{notes.length} entries</span>
          </div>

          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <textarea
              rows={3}
              placeholder="Record forensic observation, methodology, or finding..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmittingNote || !newNoteContent.trim()}>
                Save Note
              </Button>
            </div>
          </form>

          {notes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No analyst notes recorded yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                      {note.authorEmail}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Cross-Module Related Resources Section */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FolderGit2 size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Cross-Module Related Resources</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Link to={`/incidents/${investigation.incidentId}`} style={{ textDecoration: 'none' }}>
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <ShieldAlert size={18} style={{ color: '#ef4444' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Related Incident</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Incident #{investigation.incidentId.substring(0, 8)}</div>
              </div>
            </div>
          </Link>

          <Link to="/forensics" style={{ textDecoration: 'none' }}>
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Lock size={18} style={{ color: '#3b82f6' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Digital Forensics</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cases & Evidence Custody</div>
              </div>
            </div>
          </Link>

          <Link to={`/ai/investigations/${investigation.id}`} style={{ textDecoration: 'none' }}>
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Sparkles size={18} style={{ color: '#a855f7' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>AI Security Analyst</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Evidence & Hypotheses Reasoning</div>
              </div>
            </div>
          </Link>

          <Link to="/defense" style={{ textDecoration: 'none' }}>
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Layers size={18} style={{ color: '#10b981' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Active Defense</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hardening & Countermeasures</div>
              </div>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
};
export default InvestigationDetailPage;
