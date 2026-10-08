import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { incidentApi } from '../services/api/incidentApi';
import { SecurityIncident, IncidentSeverity, IncidentStatus } from '../types/incident';
import { AlertOctagon, Search, Filter, ArrowRight, ShieldAlert, Activity } from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('targetId') || '';

  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | ''>(
    (searchParams.get('severity') as IncidentSeverity) || ''
  );
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | ''>(
    (searchParams.get('status') as IncidentStatus) || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sev = searchParams.get('severity') as IncidentSeverity;
    if (sev) setSeverityFilter(sev);
    const stat = searchParams.get('status') as IncidentStatus;
    if (stat) setStatusFilter(stat);
  }, [searchParams]);

  useEffect(() => {
    loadIncidents();
  }, [targetId, severityFilter, statusFilter]);

  const loadIncidents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await incidentApi.getIncidents(
        0, 50,
        targetId || undefined,
        severityFilter || undefined,
        statusFilter || undefined
      );
      if (res && res.content) {
        setIncidents(res.content);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load security incidents');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadgeColor = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'CRITICAL': return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
      case 'HIGH': return { bg: '#fff7ed', color: '#ea580c', border: '#fdba74' };
      case 'MEDIUM': return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'LOW': return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      default: return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={24} style={{ color: '#ff4d4d' }} /> Security Incident Console
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Correlated suspicious activity, event telemetry detection, and incident response tracking
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-heading)',
            fontSize: '13px',
          }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
          <option value="INFO">Info</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-heading)',
            fontSize: '13px',
          }}
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="OPEN">Open</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="CONTAINED">Contained</option>
          <option value="RESOLVED">Resolved</option>
          <option value="FALSE_POSITIVE">False Positive</option>
        </select>
      </div>

      {/* Incident Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-dark)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Severity</th>
              <th style={{ padding: '12px 16px' }}>Incident Title</th>
              <th style={{ padding: '12px 16px' }}>Observed Source IP</th>
              <th style={{ padding: '12px 16px' }}>Confidence</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>First Observed</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading security incidents...
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No correlated security incidents recorded matching filter criteria.
                </td>
              </tr>
            ) : (
              incidents.map((inc) => {
                const badge = getSeverityBadgeColor(inc.severity);
                return (
                  <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {inc.title}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                      {inc.sourceIpConfidence === 'OBSERVED' && inc.sourceIp ? (
                        <span style={{ fontFamily: 'monospace', color: '#ffcc00', fontWeight: 600 }}>
                          {inc.sourceIp}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Source IP unavailable from telemetry
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-primary)', fontWeight: 500 }}>
                      {inc.confidence}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: 'var(--bg-dark)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-heading)'
                      }}>
                        {inc.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(inc.firstObservedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => navigate(`/incidents/${inc.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--accent-primary)',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Investigate <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
