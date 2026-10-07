import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentApi } from '../services/api/incidentApi';
import { SecurityIncident, IncidentSeverity, IncidentStatus } from '../types/incident';
import { SecurityEvent } from '../types/event';
import { TimelineEvent, InvestigationEvidence } from '../types/investigation';
import { SecurityFinding } from '../types/finding';
import { ArrowLeft, AlertOctagon, Clock, ShieldAlert, FileText, Link2, GitCommit, Layers, ArrowRight } from 'lucide-react';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<SecurityIncident | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'events' | 'attack-chain' | 'evidence' | 'findings'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [attackChain, setAttackChain] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<InvestigationEvidence[]>([]);
  const [relatedFindings, setRelatedFindings] = useState<SecurityFinding[]>([]);

  const [newStatus, setNewStatus] = useState<IncidentStatus | ''>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      loadIncidentDetail();
    }
  }, [id]);

  const loadIncidentDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await incidentApi.getIncidentById(id);
      if (res.success && res.data) {
        setIncident(res.data);
        setNewStatus(res.data.status);
      }

      const [evRes, timeRes, chainRes, evidRes, findRes] = await Promise.all([
        incidentApi.getEventsForIncident(id).catch(() => ({ success: false, data: [] })),
        incidentApi.getTimelineForIncident(id).catch(() => ({ success: false, data: [] })),
        incidentApi.getAttackChainForIncident(id).catch(() => ({ success: false, data: null })),
        incidentApi.getEvidenceForIncident(id).catch(() => ({ success: false, data: [] })),
        incidentApi.getRelatedFindingsForIncident(id).catch(() => ({ success: false, data: [] }))
      ]);

      if (evRes.data) setEvents(evRes.data);
      if (timeRes.data) setTimeline(timeRes.data);
      if (chainRes.data) setAttackChain(chainRes.data);
      if (evidRes.data) setEvidenceList(evidRes.data);
      if (findRes.data) setRelatedFindings(findRes.data);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load incident details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newStatus || newStatus === incident?.status) return;

    setIsUpdatingStatus(true);
    try {
      const res = await incidentApi.updateStatus(id, newStatus);
      if (res.success) {
        await loadIncidentDetail();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update incident status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenWorkspace = async () => {
    if (!id) return;
    try {
      const res = await incidentApi.createOrGetInvestigation(id);
      if (res.success && res.data) {
        navigate(`/investigations/${res.data.id}`);
      }
    } catch (err: any) {
      alert('Failed to open investigation workspace');
    }
  };

  const getSeverityBadgeColor = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'CRITICAL': return { bg: '#3b0000', color: '#ff4d4d', border: '#800000' };
      case 'HIGH': return { bg: '#2b1000', color: '#ff9933', border: '#803300' };
      case 'MEDIUM': return { bg: '#2b2000', color: '#ffcc00', border: '#806600' };
      case 'LOW': return { bg: '#002b10', color: '#33cc66', border: '#008033' };
      default: return { bg: '#1a1a2e', color: '#8a8aa3', border: '#33334d' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading security incident details...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/incidents')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} /> Back to Incidents
        </button>
        <div style={{ padding: '16px', backgroundColor: '#3b0000', border: '1px solid #800000', borderRadius: '8px', color: '#ff4d4d' }}>
          {error || 'Incident not found.'}
        </div>
      </div>
    );
  }

  const badge = getSeverityBadgeColor(incident.severity);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/incidents')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '13px',
        }}
      >
        <ArrowLeft size={14} /> Back to Incidents
      </button>

      {/* Header card */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: badge.bg,
                color: badge.color,
                border: `1px solid ${badge.border}`
              }}>
                {incident.severity}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                Confidence: {incident.confidence}
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
              {incident.title}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleOpenWorkspace}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Investigation Workspace <ArrowRight size={14} />
            </button>

            <form onSubmit={handleStatusUpdate} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-heading)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <option value="NEW">NEW</option>
                <option value="OPEN">OPEN</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="CONTAINED">CONTAINED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
              </select>
              {newStatus !== incident.status && (
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
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
                  Save Status
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Source IP Banner */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-dark)',
          border: '1px solid var(--border-color)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}>
          <ShieldAlert size={16} style={{ color: incident.sourceIpConfidence === 'OBSERVED' ? '#ffcc00' : 'var(--text-muted)' }} />
          <div>
            {incident.sourceIpConfidence === 'OBSERVED' && incident.sourceIp ? (
              <span>Observed Source IP Telemetry: <strong style={{ fontFamily: 'monospace', color: '#ffcc00' }}>{incident.sourceIp}</strong> (Verified)</span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Source IP unavailable from available telemetry.</span>
            )}
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-heading)', margin: 0 }}>
          {incident.description}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {[
          { key: 'overview', label: 'Overview', icon: FileText },
          { key: 'timeline', label: `Timeline (${timeline.length})`, icon: Clock },
          { key: 'events', label: `Telemetry Events (${events.length})`, icon: Layers },
          { key: 'attack-chain', label: 'Attack Chain', icon: GitCommit },
          { key: 'evidence', label: `Evidence (${evidenceList.length})`, icon: Link2 },
          { key: 'findings', label: `Related Findings (${relatedFindings.length})`, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Target ID</span>
              <div style={{ fontWeight: 600, fontFamily: 'monospace', marginTop: '2px' }}>{incident.targetId}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Correlation Key</span>
              <div style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '12px', marginTop: '2px', wordBreak: 'break-all' }}>{incident.correlationKey}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>First Observed At</span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{new Date(incident.firstObservedAt).toLocaleString()}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Last Observed At</span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{new Date(incident.lastObservedAt).toLocaleString()}</div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {timeline.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No timeline events recorded yet.</p>
            ) : (
              timeline.map((te, idx) => (
                <div key={te.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '160px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {new Date(te.eventTime).toLocaleTimeString()}
                  </div>
                  <div style={{ flex: 1, padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '13px' }}>{te.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{te.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No raw security events linked.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span style={{ color: 'var(--accent-primary)' }}>{ev.eventType} ({ev.httpMethod} {ev.path})</span>
                    <span>{new Date(ev.eventTime).toLocaleString()}</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '4px' }}>{ev.normalizedData}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'attack-chain' && (
          <div>
            {!attackChain || !attackChain.nodes || attackChain.nodes.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Attack chain node graph being generated from telemetry sequence...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                {attackChain.nodes.map((node: any, idx: number) => (
                  <React.Fragment key={node.id}>
                    <div style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-dark)',
                      border: '1px solid var(--accent-primary)',
                      textAlign: 'center',
                      minWidth: '280px',
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700 }}>{node.nodeType}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginTop: '2px' }}>{node.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Confidence: {node.confidence}</div>
                    </div>
                    {idx < attackChain.nodes.length - 1 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>↓ PRECEDES / LEADS TO</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {evidenceList.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No investigation evidence linked.</p>
            ) : (
              evidenceList.map((ev) => (
                <div key={ev.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', fontSize: '13px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{ev.description}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Type: {ev.evidenceType} | Source: {ev.sourceType} ({ev.sourceId})</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'findings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {relatedFindings.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No correlated Phase 3 vulnerability findings linked.</p>
            ) : (
              relatedFindings.map((f) => (
                <div key={f.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#ff9933', marginRight: '8px' }}>[{f.severity}]</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{f.title}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/findings/${f.id}`)}
                    style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    View Finding
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
