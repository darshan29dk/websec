import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { auditApi } from '../services/api/auditApi';
import { Target } from '../types/target';
import { Assessment } from '../types/assessment';
import { AuditEvent } from '../types/audit';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Target as TargetIcon, ShieldCheck, Activity, Plus, FileText } from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [targetPage, assessmentPage, auditPage] = await Promise.all([
          targetApi.getTargets(0, 10),
          assessmentApi.getAssessments(0, 5),
          auditApi.getAuditEvents({ page: 0, size: 5 }),
        ]);

        setTargets(targetPage.content);
        setAssessments(assessmentPage.content);
        setAuditEvents(auditPage.content);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeTargetsCount = targets.filter((t) => t.status === 'ACTIVE').length;
  const authorizedTargetsCount = targets.filter((t) => t.authorized).length;
  const activeAssessmentsCount = assessments.filter((a) => a.status === 'QUEUED' || a.status === 'RUNNING').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Security Overview</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Authorized target management & assessment posture
          </p>
        </div>
        <Link to="/targets/new">
          <Button variant="primary" icon={<Plus size={16} />}>
            Add Target
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Card style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Active Targets
              </span>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
                {activeTargetsCount}
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(56, 139, 253, 0.1)', color: 'var(--accent-primary)' }}>
              <TargetIcon size={22} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Authorized Targets
              </span>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
                {authorizedTargetsCount}
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(46, 160, 67, 0.1)', color: 'var(--status-active-text)' }}>
              <ShieldCheck size={22} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Active Assessments
              </span>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
                {activeAssessmentsCount}
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(210, 153, 34, 0.1)', color: 'var(--status-warning-text)' }}>
              <Activity size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Targets Table */}
        <Card
          title="Registered Security Targets"
          subtitle="Authorized target websites configured for assessment"
          action={
            <Link to="/targets">
              <Button variant="secondary" size="sm">
                View All Targets
              </Button>
            </Link>
          }
        >
          {targets.length === 0 && !isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <TargetIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', fontWeight: 500 }}>No targets registered yet.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Register your authorized web domain or URL to begin setup.
              </p>
            </div>
          ) : (
            <Table
              isLoading={isLoading}
              data={targets.slice(0, 5)}
              keyExtractor={(item) => item.id}
              columns={[
                {
                  header: 'Target Name',
                  render: (t) => (
                    <Link to={`/targets/${t.id}`} style={{ fontWeight: 600 }}>
                      {t.name}
                    </Link>
                  ),
                },
                { header: 'Primary URL', accessor: 'primaryUrl' },
                {
                  header: 'Status',
                  render: (t) => <StatusBadge status={t.status} />,
                },
                {
                  header: 'Authorization',
                  render: (t) =>
                    t.authorized ? (
                      <StatusBadge status="ACTIVE" />
                    ) : (
                      <StatusBadge status="EXPIRED" />
                    ),
                },
                {
                  header: 'Created Date',
                  render: (t) => new Date(t.createdAt).toLocaleDateString(),
                },
              ]}
            />
          )}
        </Card>

        {/* Recent Audit Events */}
        <Card
          title="Recent Audit Events"
          subtitle="System security audit log trace"
          action={
            <Link to="/audit">
              <Button variant="secondary" size="sm">
                View Audit Trail
              </Button>
            </Link>
          }
        >
          <Table
            isLoading={isLoading}
            data={auditEvents}
            keyExtractor={(item) => item.id}
            columns={[
              {
                header: 'Timestamp',
                render: (a) => new Date(a.createdAt).toLocaleString(),
                width: '180px',
              },
              { header: 'Actor', accessor: 'actorEmail' },
              { header: 'Event Type', render: (a) => <code style={{ fontSize: '11px' }}>{a.eventType}</code> },
              { header: 'Action', accessor: 'action' },
              { header: 'Resource', render: (a) => `${a.resourceType}:${a.resourceId?.substring(0, 8) || ''}` },
              { header: 'IP Address', accessor: 'ipAddress' },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};
