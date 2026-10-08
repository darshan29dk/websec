import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { findingApi } from '../services/api/findingApi';
import { SecurityFinding, FindingSeverity, FindingStatus } from '../types/finding';
import { AlertTriangle, Shield, Search, Filter, ArrowRight } from 'lucide-react';

export const FindingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId') || '';

  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | ''>('');
  const [statusFilter, setStatusFilter] = useState<FindingStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFindings();
  }, [assessmentId, severityFilter, statusFilter, searchQuery]);

  const loadFindings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await findingApi.getFindings(
        0, 50,
        assessmentId || undefined,
        severityFilter || undefined,
        statusFilter || undefined,
        undefined,
        undefined,
        searchQuery || undefined
      );
      if (res && res.content) {
        setFindings(res.content);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vulnerability findings');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadgeColor = (sev: FindingSeverity) => {
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            Vulnerability Finding Intelligence
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Normalized, deduplicated security observations with evidence provenance and severity scoring
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search findings by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-heading)',
              fontSize: '13px',
            }}
          />
        </div>

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
          <option value="OPEN">Open</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="FALSE_POSITIVE">False Positive</option>
          <option value="ACCEPTED_RISK">Accepted Risk</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REOPENED">Reopened</option>
        </select>
      </div>

      {/* Findings Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-dark)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Severity</th>
              <th style={{ padding: '12px 16px' }}>Title</th>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>Source Tools</th>
              <th style={{ padding: '12px 16px' }}>Confidence</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading security findings...
                </td>
              </tr>
            ) : findings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No security findings recorded matching filter criteria.
                </td>
              </tr>
            ) : (
              findings.map((f) => {
                const badge = getSeverityBadgeColor(f.severity);
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                        {f.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {f.title}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {f.findingType}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
                      {f.source}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-primary)', fontWeight: 500 }}>
                      {f.confidence}
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
                        {f.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => navigate(`/findings/${f.id}`)}
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
                        Details <ArrowRight size={12} />
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
