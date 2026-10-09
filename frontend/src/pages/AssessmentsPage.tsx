import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assessmentApi } from '../services/api/assessmentApi';
import { Assessment, AssessmentStatus } from '../types/assessment';
import { PageResponse } from '../types/common';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Plus, Eye, Activity, Ban } from 'lucide-react';

export const AssessmentsPage: React.FC = () => {
  const [assessmentPage, setAssessmentPage] = useState<PageResponse<Assessment> | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const data = await assessmentApi.getAssessments(
        page,
        10,
        undefined,
        statusFilter ? (statusFilter as AssessmentStatus) : undefined
      );
      setAssessmentPage(data);
    } catch (err) {
      console.error('Failed to fetch assessments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [page, statusFilter]);

  const handleCancelAssessment = async (id: string) => {
    if (window.confirm('Cancel this queued assessment?')) {
      try {
        await assessmentApi.cancelAssessment(id);
        fetchAssessments();
      } catch (err: any) {
        alert(err.message || 'Failed to cancel assessment.');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Security Assessments</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Assessment lifecycle & queued profile execution records
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/fuzzing">
            <Button variant="outline">
              Web Fuzzing Workspace
            </Button>
          </Link>
          <Link to="/assessments/new">
            <Button variant="primary" icon={<Plus size={16} />}>
              Create Assessment
            </Button>
          </Link>
        </div>
      </div>

      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Filter by Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            style={{
              width: '180px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          isLoading={isLoading}
          data={assessmentPage?.content || []}
          keyExtractor={(item) => item.id}
          emptyMessage="No security assessments created yet."
          columns={[
            {
              header: 'Assessment ID',
              render: (a) => (
                <Link to={`/assessments/${a.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                  {a.id.substring(0, 8)}...
                </Link>
              ),
            },
            {
              header: 'Target Name',
              render: (a) => (
                <Link to={`/targets/${a.targetId}`} style={{ color: 'var(--text-heading)', fontWeight: 500 }}>
                  {a.targetName}
                </Link>
              ),
            },
            { header: 'Profile Name', accessor: 'profileName' },
            {
              header: 'Status',
              render: (a) => <StatusBadge status={a.status} />,
            },
            { header: 'Requested By', render: (a: any) => a.requestedByName || a.createdBy || 'System' },
            {
              header: 'Created Date',
              render: (a) => new Date(a.createdAt).toLocaleString(),
            },
            {
              header: 'Actions',
              render: (a) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to={`/assessments/${a.id}`}>
                    <Button variant="secondary" size="sm" icon={<Eye size={12} />}>
                      View
                    </Button>
                  </Link>
                  {a.status === 'QUEUED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Ban size={12} />}
                      onClick={() => handleCancelAssessment(a.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />

        {assessmentPage && assessmentPage.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {assessmentPage.page + 1} of {assessmentPage.totalPages} ({assessmentPage.totalElements} records)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={assessmentPage.page === 0}
                onClick={() => setPage(assessmentPage.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={assessmentPage.last}
                onClick={() => setPage(assessmentPage.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
