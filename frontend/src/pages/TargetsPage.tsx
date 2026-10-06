import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { Target, TargetStatus } from '../types/target';
import { PageResponse } from '../types/common';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, Search, Eye, Edit2, ShieldAlert, Power } from 'lucide-react';

export const TargetsPage: React.FC = () => {
  const [targetPage, setTargetPage] = useState<PageResponse<Target> | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTargets = async () => {
    setIsLoading(true);
    try {
      const data = await targetApi.getTargets(
        page,
        10,
        statusFilter ? (statusFilter as TargetStatus) : undefined,
        search || undefined
      );
      setTargetPage(data);
    } catch (err) {
      console.error('Failed to fetch targets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchTargets();
  };

  const handleDisableTarget = async (targetId: string) => {
    if (window.confirm('Are you sure you want to disable this security target?')) {
      try {
        await targetApi.disableTarget(targetId);
        fetchTargets();
      } catch (err) {
        console.error('Failed to disable target', err);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Authorized Security Targets</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage registered web applications & target authorizations
          </p>
        </div>
        <Link to="/targets/new">
          <Button variant="primary" icon={<Plus size={16} />}>
            Add Target
          </Button>
        </Link>
      </div>

      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Search target name or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" icon={<Search size={14} />}>
            Filter
          </Button>
        </form>
      </Card>

      <Card>
        <Table
          isLoading={isLoading}
          data={targetPage?.content || []}
          keyExtractor={(item) => item.id}
          emptyMessage="No targets registered yet. Click 'Add Target' above to register your first web security target."
          columns={[
            {
              header: 'Target Name',
              render: (t) => (
                <div>
                  <Link to={`/targets/${t.id}`} style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                    {t.name}
                  </Link>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created by {t.createdByName}</div>
                </div>
              ),
            },
            {
              header: 'Primary URL',
              render: (t) => (
                <a href={t.primaryUrl} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {t.primaryUrl}
                </a>
              ),
            },
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
                  <span style={{ fontSize: '11px', color: 'var(--status-danger-text)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={12} /> Missing / Expired
                  </span>
                ),
            },
            {
              header: 'Created At',
              render: (t) => new Date(t.createdAt).toLocaleDateString(),
            },
            {
              header: 'Actions',
              render: (t) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to={`/targets/${t.id}`}>
                    <Button variant="secondary" size="sm" icon={<Eye size={12} />}>
                      View
                    </Button>
                  </Link>
                  {t.status === 'ACTIVE' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Power size={12} />}
                      onClick={() => handleDisableTarget(t.id)}
                    >
                      Disable
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />

        {targetPage && targetPage.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {targetPage.page + 1} of {targetPage.totalPages} ({targetPage.totalElements} targets)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={targetPage.page === 0}
                onClick={() => setPage(targetPage.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={targetPage.last}
                onClick={() => setPage(targetPage.page + 1)}
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
