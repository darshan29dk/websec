import React, { useEffect, useState } from 'react';
import { healthApi, HealthData } from '../services/api/healthApi';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Server, Database, GitCommit, RefreshCw } from 'lucide-react';

export const SystemPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await healthApi.getHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to load system health', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>System & Infrastructure Status</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            AEGIS backend health, database connection, and Flyway schema migration status
          </p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchHealth} isLoading={isLoading}>
          Refresh Health
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Backend App Status */}
        <Card title="Application Instance">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Spring Boot Backend</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{health?.applicationName || 'AEGIS Core'}</div>
              </div>
            </div>
            <StatusBadge status={health?.status || 'UNKNOWN'} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Version</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{health?.version || '1.0.0-SNAPSHOT'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Java Runtime</span>
              <span>Java 21 OpenJDK</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Checked</span>
              <span>{health ? new Date(health.timestamp).toLocaleTimeString() : '-'}</span>
            </div>
          </div>
        </Card>

        {/* Database Connectivity Status */}
        <Card title="Database Connectivity">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="var(--status-active-text)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>PostgreSQL Database</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supabase Compatible</div>
              </div>
            </div>
            <StatusBadge status={health?.components?.database?.status || 'UP'} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Engine</span>
              <span>{health?.components?.database?.databaseProduct || 'PostgreSQL'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>ORM / Validation</span>
              <span>Hibernate (ddl-auto=validate)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection Pool</span>
              <span>HikariCP (Max 10)</span>
            </div>
          </div>
        </Card>

        {/* Flyway Migrations Status */}
        <Card title="Database Schema Migrations">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GitCommit size={20} color="var(--status-queued-text)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Flyway Migration Engine</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Source of Truth</div>
              </div>
            </div>
            <StatusBadge status={health?.components?.migrations?.status || 'UP'} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Applied Migration</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>V1__initial_schema.sql</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Schema Version</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{health?.components?.migrations?.currentVersion || 'V1'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Applied Script Count</span>
              <span>{health?.components?.migrations?.appliedCount || 1} script</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
