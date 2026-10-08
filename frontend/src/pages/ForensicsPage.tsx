import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { forensicApi } from '../services/api/forensicApi';
import { ForensicCase, CaseStatus } from '../types/forensic';
import { FolderGit2, Search, Filter, ShieldAlert, Plus, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Table } from '../components/Table';

export const ForensicsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('targetId') || '';

  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    loadCases();
  }, [page, statusFilter, targetId]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await forensicApi.getCases({
        targetId: targetId || undefined,
        status: statusFilter || undefined,
        page,
        size: 15,
      });
      if (res && res.content) {
        setCases(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load forensic cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ffedd5', color: '#ea580c' }}>
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#d97706' }}>
            MEDIUM
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
            LOW
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
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
            <FolderGit2 size={24} color="var(--accent-primary)" /> Digital Forensic Cases
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Evidence-driven reconstruction, SHA-256 hash integrity verification, and forensic attack event timelines
          </p>
        </div>

        {targetId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filtered by target:</span>
            <code style={{ fontSize: '12px', color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px' }}>
              {targetId.substring(0, 8)}...
            </code>
            <Button size="sm" variant="secondary" onClick={() => navigate('/forensics')}>
              Clear Filter
            </Button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={14} color="var(--accent-primary)" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              backgroundColor: '#ffffff',
              color: 'var(--text-main)',
            }}
          >
            <option value="">All Case Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="EVIDENCE_COMPLETE">Evidence Complete</option>
            <option value="CLOSED">Closed</option>
            <option value="INCONCLUSIVE">Inconclusive</option>
          </select>
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing {cases.length} forensic cases
        </span>
      </div>

      {/* Main Table or Empty State (Requirement 8) */}
      <Card title="Forensic Case Inventory" subtitle="Immutable chain of custody and case records">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading forensic investigation records...
          </div>
        ) : cases.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
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
              <FolderGit2 size={28} color="var(--accent-primary)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 6px 0' }}>
              No Forensic Cases Have Been Created
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Investigate an active incident to create or associate a formal forensic case with SHA-256 evidence integrity chains.
            </p>
            <Button variant="primary" onClick={() => navigate('/incidents')}>
              View Incidents to Investigate
            </Button>
          </div>
        ) : (
          <Table
            data={cases}
            keyExtractor={(c) => c.id}
            columns={[
              {
                header: 'Case ID',
                render: (c) => (
                  <Link
                    to={`/forensics/${c.id}`}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}
                  >
                    {c.caseNumber || c.id.substring(0, 8)}
                  </Link>
                ),
              },
              {
                header: 'Title',
                render: (c) => (
                  <Link to={`/forensics/${c.id}`} style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                    {c.title}
                  </Link>
                ),
              },
              {
                header: 'Target',
                render: (c) => (
                  <Link to={`/targets/${c.targetId}`} style={{ fontSize: '12px' }}>
                    {c.targetName || 'Scope'}
                  </Link>
                ),
              },
              {
                header: 'Incident',
                render: (c) =>
                  c.incidentId ? (
                    <Link to={`/incidents/${c.incidentId}`} style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                      Incident #{c.incidentId.substring(0, 8)}
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>None</span>
                  ),
              },
              {
                header: 'Severity',
                render: (c) => getPriorityBadge(c.priority),
              },
              {
                header: 'Status',
                render: (c) => <StatusBadge status={c.status} />,
              },
              {
                header: 'Evidence Items',
                render: (c) => (
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {c.evidenceCount || 0}
                  </span>
                ),
              },
              {
                header: 'Created',
                render: (c) => new Date(c.openedAt).toLocaleDateString(),
              },
              {
                header: 'Assigned Analyst',
                render: (c) => c.createdByEmail || 'Unassigned',
              },
              {
                header: 'Action',
                render: (c) => (
                  <Link to={`/forensics/${c.id}`} style={{ fontSize: '12px', fontWeight: 600 }}>
                    Examine Case →
                  </Link>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
};
