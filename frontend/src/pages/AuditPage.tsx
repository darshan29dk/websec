import React, { useEffect, useState } from 'react';
import { auditApi } from '../services/api/auditApi';
import { AuditEvent, AuditEventType } from '../types/audit';
import { PageResponse } from '../types/common';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Search, Filter, ShieldAlert } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [auditPage, setAuditPage] = useState<PageResponse<AuditEvent> | null>(null);
  const [page, setPage] = useState(0);
  const [userFilter, setUserFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditApi.getAuditEvents({
        page,
        size: 15,
        user: userFilter || undefined,
        eventType: eventTypeFilter ? (eventTypeFilter as AuditEventType) : undefined,
        resourceType: resourceFilter || undefined,
        search: search || undefined,
      });
      setAuditPage(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, eventTypeFilter]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchAuditLogs();
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Security Audit Trail</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Immutable log of all security-sensitive actions and operations
        </p>
      </div>

      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
          <Input
            label="User Email"
            placeholder="Filter by user email..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ marginBottom: 0 }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500 }}>Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
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
              <option value="">All Event Types</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="TARGET_CREATED">TARGET_CREATED</option>
              <option value="TARGET_UPDATED">TARGET_UPDATED</option>
              <option value="TARGET_DISABLED">TARGET_DISABLED</option>
              <option value="AUTHORIZATION_CREATED">AUTHORIZATION_CREATED</option>
              <option value="ASSESSMENT_CREATED">ASSESSMENT_CREATED</option>
              <option value="ASSESSMENT_CANCELLED">ASSESSMENT_CANCELLED</option>
            </select>
          </div>

          <Input
            label="Resource Type"
            placeholder="e.g. SecurityTarget"
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            style={{ marginBottom: 0 }}
          />

          <Input
            label="Keyword Search"
            placeholder="Search action or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 0 }}
          />

          <Button type="submit" variant="secondary" icon={<Filter size={14} />}>
            Apply Filters
          </Button>
        </form>
      </Card>

      <Card>
        <Table
          isLoading={isLoading}
          data={auditPage?.content || []}
          keyExtractor={(item) => item.id}
          emptyMessage="No audit log events match your filter criteria."
          columns={[
            {
              header: 'Timestamp',
              render: (a) => (
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              ),
              width: '170px',
            },
            {
              header: 'User',
              render: (a) => a.actorEmail || <span style={{ color: 'var(--text-muted)' }}>System / Anonymous</span>,
            },
            {
              header: 'Event Type',
              render: (a) => (
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {a.eventType}
                </span>
              ),
            },
            { header: 'Action', accessor: 'action' },
            {
              header: 'Resource',
              render: (a) => (
                <span style={{ fontSize: '12px' }}>
                  {a.resourceType} {a.resourceId ? `(${a.resourceId.substring(0, 8)}...)` : ''}
                </span>
              ),
            },
            {
              header: 'IP Address',
              render: (a) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{a.ipAddress || '-'}</span>,
            },
            {
              header: 'Details / Result',
              render: (a) => <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.details || '-'}</span>,
            },
          ]}
        />

        {auditPage && auditPage.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {auditPage.page + 1} of {auditPage.totalPages} ({auditPage.totalElements} events)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={auditPage.page === 0}
                onClick={() => setPage(auditPage.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={auditPage.last}
                onClick={() => setPage(auditPage.page + 1)}
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
