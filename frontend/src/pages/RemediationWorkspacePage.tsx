import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { findingApi } from '../services/api/findingApi';
import { defenseApi } from '../services/api/defenseApi';
import { retestApi } from '../services/api/retestApi';
import { SecurityFinding, FindingSeverity, FindingStatus } from '../types/finding';
import { RemediationPlan } from '../types/defense';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Table } from '../components/Table';
import {
  Wrench,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  Lock,
  ExternalLink,
  ShieldCheck,
  Target as TargetIcon,
} from 'lucide-react';

export const RemediationWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('targetId') || '';

  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [plans, setPlans] = useState<RemediationPlan[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [findRes, plansRes] = await Promise.allSettled([
        findingApi.getFindings(0, 100, undefined, targetId || undefined),
        defenseApi.listRemediationPlans(),
      ]);

      if (findRes.status === 'fulfilled' && findRes.value?.content) {
        setFindings(findRes.value.content);
        if (findRes.value.content.length > 0 && !selectedFinding) {
          setSelectedFinding(findRes.value.content[0]);
        }
      }
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value)) {
        setPlans(plansRes.value);
      }
    } catch (err) {
      console.error('Failed to load remediation items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetId]);

  const handleUpdateStatus = async (findingId: string, newStatus: FindingStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await findingApi.updateStatus(findingId, newStatus, `Remediation status updated to ${newStatus}`);
      setFindings((prev) => prev.map((f) => (f.id === findingId ? updated : f)));
      if (selectedFinding?.id === findingId) {
        setSelectedFinding(updated);
      }
    } catch {
      alert('Failed to update remediation status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredFindings = findings.filter(
    (f) => !statusFilter || f.status === statusFilter
  );

  const openCount = findings.filter((f) => f.status === 'OPEN').length;
  const inProgressCount = findings.filter((f) => f.status === 'CONFIRMED' || f.status === 'REOPENED').length;
  const validatedCount = findings.filter((f) => f.status === 'RESOLVED' || f.status === 'ACCEPTED_RISK').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={22} color="var(--accent-primary)" /> Remediation &amp; Vulnerability Lifecycle
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Track security vulnerabilities through ACKNOWLEDGED, IN_PROGRESS, RETEST_REQUIRED, and VALIDATED stages
          </p>
        </div>

        {targetId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filtered by Target:</span>
            <code style={{ fontSize: '12px', color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px' }}>
              {targetId.substring(0, 8)}...
            </code>
            <Button size="sm" variant="secondary" onClick={() => navigate('/remediation')}>
              Clear Filter
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Remediation Tasks
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '6px' }}>
            {findings.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Active vulnerability fixes
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Open / Pending Action
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
            {openCount}
          </div>
          <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
            Awaiting developer response
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            In Progress / Submitted
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>
            Fix being implemented
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Validated &amp; Closed
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
            {validatedCount}
          </div>
          <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
            Retested &amp; confirmed fixed
          </div>
        </Card>
      </div>

      {/* Main Table (Requirement 11) */}
      <Card title="Remediation Backlog &amp; Workflow Items" subtitle="Click any remediation record to inspect fix guidance and execute status transitions">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading remediation backlog...
          </div>
        ) : filteredFindings.length === 0 ? (
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
              <ShieldCheck size={28} color="#15803d" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 6px 0' }}>
              No Open Remediation Items
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              All scanned targets have either clean security baselines or all vulnerabilities have been resolved.
            </p>
            <Button variant="primary" onClick={() => navigate('/assessments')}>
              View Assessments
            </Button>
          </div>
        ) : (
          <Table
            data={filteredFindings}
            keyExtractor={(f) => f.id}
            columns={[
              {
                header: 'Finding',
                render: (f) => (
                  <div style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{f.title}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ID: {f.id.substring(0, 8)}...
                    </div>
                  </div>
                ),
              },
              {
                header: 'Severity',
                render: (f) => <StatusBadge status={f.severity} />,
              },
              {
                header: 'Current Status',
                render: (f) => <StatusBadge status={f.status} />,
              },
              {
                header: 'Recommended Fix',
                render: (f) => (
                  <div style={{ maxWidth: '280px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.description || 'Apply security patch / configure HTTP headers'}
                  </div>
                ),
              },
              {
                header: 'Created Date',
                render: (f) => new Date(f.createdAt).toLocaleDateString(),
              },
              {
                header: 'Retest Status',
                render: (f) => (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {f.status === 'RESOLVED' ? 'CONFIRMED FIXED' : 'RETEST AVAILABLE'}
                  </span>
                ),
              },
              {
                header: 'Action',
                render: (f) => (
                  <button
                    onClick={() => setSelectedFinding(f)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    Examine Fix →
                  </button>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* Remediation Detail Modal (Requirement 11) */}
      {selectedFinding && (
        <Modal
          isOpen={!!selectedFinding}
          onClose={() => setSelectedFinding(null)}
          title={`Remediation Plan: ${selectedFinding.title}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusBadge status={selectedFinding.severity} />
                <StatusBadge status={selectedFinding.status} />
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                ID: {selectedFinding.id}
              </span>
            </div>

            {/* Description & Risk */}
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Vulnerability Risk &amp; Description
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-heading)', marginTop: '4px', lineHeight: '1.4' }}>
                {selectedFinding.description || selectedFinding.title}
              </div>
            </div>

            {/* Recommended Fix */}
            <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                Recommended Fix Guidance
              </div>
              <div style={{ fontSize: '12.5px', color: '#065f46', marginTop: '4px', lineHeight: '1.4' }}>
                {selectedFinding.description || 'Implement recommended security headers and revalidate.'}
              </div>
            </div>

            {/* Workflow Status Selector */}
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Update Remediation Stage
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(['OPEN', 'CONFIRMED', 'RESOLVED', 'REOPENED', 'ACCEPTED_RISK', 'FALSE_POSITIVE'] as FindingStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedFinding.id, st)}
                      disabled={updatingStatus || selectedFinding.status === st}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: selectedFinding.status === st ? 'var(--accent-primary)' : 'var(--border-color)',
                        backgroundColor: selectedFinding.status === st ? 'var(--accent-light)' : '#ffffff',
                        color: selectedFinding.status === st ? 'var(--accent-primary)' : 'var(--text-main)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <Link to={`/retests?findingId=${selectedFinding.id}`}>
                <Button variant="secondary" icon={<RotateCcw size={14} />}>
                  Request Controlled Retest
                </Button>
              </Link>
              <Button variant="primary" onClick={() => setSelectedFinding(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
