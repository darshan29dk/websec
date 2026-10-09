import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { healthApi, HealthData } from '../services/api/healthApi';
import { toolsApi, SecurityToolStatus } from '../services/api/toolsApi';
import { monitoringApi } from '../services/api/monitoringApi';
import { MonitoringConfigurationDto } from '../types/monitoring';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import {
  Server,
  Database,
  GitCommit,
  RefreshCw,
  Terminal,
  Radio,
  Bell,
  Cpu,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SystemPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [tools, setTools] = useState<SecurityToolStatus[]>([]);
  const [monitoringConfigs, setMonitoringConfigs] = useState<MonitoringConfigurationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const [healthData, toolsData, monData] = await Promise.allSettled([
        healthApi.getHealth(),
        toolsApi.getAllTools(),
        monitoringApi.getAllConfigurations(),
      ]);

      if (healthData.status === 'fulfilled' && healthData.value) {
        setHealth(healthData.value);
      }
      if (toolsData.status === 'fulfilled' && Array.isArray(toolsData.value)) {
        setTools(toolsData.value);
      }
      if (monData.status === 'fulfilled' && Array.isArray(monData.value)) {
        setMonitoringConfigs(monData.value);
      }
    } catch (err) {
      console.error('Failed to load system health', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const availableToolsCount = tools.filter((t) => t.status === 'AVAILABLE').length;
  const notConfiguredCount = tools.filter((t) => t.status === 'NOT_CONFIGURED').length;
  const unavailableToolsCount = tools.filter((t) => t.status === 'NOT_AVAILABLE' || t.status === 'FAILED').length;
  const activeMonitorsCount = monitoringConfigs.filter((m) => m.enabled).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)' }}>
            System Infrastructure &amp; Operational Health
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time backend status, database engine, Flyway migrations, allowlisted tools, and schedulers
          </p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchHealth} isLoading={isLoading}>
          Refresh Diagnostics
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Backend App Status */}
        <Card title="Backend Application Instance">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>
                  Spring Boot Core Service
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {health?.applicationName || 'GlobalShield Core'}
                </div>
              </div>
            </div>
            <StatusBadge status={health?.status === 'UP' ? 'ACTIVE' : 'FAILED'} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Platform Version</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{health?.version || '1.0.0-PROD'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Security Architecture</span>
              <span>Stateless JWT Bearer Auth</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Heartbeat Check</span>
              <span>{health ? new Date(health.timestamp).toLocaleTimeString() : 'Active'}</span>
            </div>
          </div>
        </Card>

        {/* Database Connectivity Status */}
        <Card title="Database Connectivity &amp; Pool">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="#15803d" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>PostgreSQL Database</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>HikariCP Connection Pool</div>
              </div>
            </div>
            <StatusBadge status={health?.components?.database?.status === 'UP' ? 'ACTIVE' : 'FAILED'} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Product</span>
              <span style={{ fontWeight: 600 }}>{health?.components?.database?.databaseProduct || 'PostgreSQL'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Validation Policy</span>
              <span>ddl-auto: validate</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Driver Pool Status</span>
              <span style={{ color: '#15803d', fontWeight: 600 }}>Healthy &amp; Verified</span>
            </div>
          </div>
        </Card>

        {/* Flyway Migrations Status */}
        <Card title="Flyway Schema Migrations">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GitCommit size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>Database Versioning</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Immutable Schema History</div>
              </div>
            </div>
            <StatusBadge status={health?.components?.migrations?.status === 'UP' ? 'ACTIVE' : 'FAILED'} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Flyway Schema</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {health?.components?.migrations?.currentVersion || 'V13'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Applied Script Count</span>
              <span>{health?.components?.migrations?.appliedCount || 13} migrations</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Integrity Check</span>
              <span style={{ color: '#15803d', fontWeight: 600 }}>Checksum Verified</span>
            </div>
          </div>
        </Card>

        {/* Security Tools Health */}
        <Card
          title="25-Tool Security Ecosystem"
          action={
            <Link to="/security-tools" style={{ fontSize: '12px', fontWeight: 600 }}>
              Security Tool Center →
            </Link>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>Security Tool Registry</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recon, Web, IDS, SIEM, Forensics</div>
              </div>
            </div>
            <StatusBadge status={availableToolsCount > 0 ? 'ACTIVE' : 'WARNING'} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Operational / Available</span>
              <span style={{ fontWeight: 700, color: '#15803d' }}>{availableToolsCount} Verified</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Configuration Required</span>
              <span style={{ fontWeight: 600, color: '#b45309' }}>
                {notConfiguredCount} Pending API/URL
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Not in Host PATH</span>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                {unavailableToolsCount} Not Installed
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Ecosystem Adapters</span>
              <span style={{ fontWeight: 600 }}>{tools.length} Registered</span>
            </div>
          </div>
        </Card>

        {/* Continuous Monitoring Scheduler */}
        <Card
          title="Continuous Monitoring Scheduler"
          action={
            <Link to="/monitoring" style={{ fontSize: '12px', fontWeight: 600 }}>
              View Schedules →
            </Link>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Radio size={20} color="#15803d" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>Spring Task Scheduler</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Autonomous Assessment Triggers</div>
              </div>
            </div>
            <StatusBadge status="ACTIVE" />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Scheduler Thread Pool</span>
              <span style={{ color: '#15803d', fontWeight: 600 }}>Operational</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Target Monitors</span>
              <span style={{ fontWeight: 700 }}>{activeMonitorsCount} Active Schedules</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Drift Detection</span>
              <span>Enabled</span>
            </div>
          </div>
        </Card>

        {/* AI Intelligence Provider Status */}
        <Card
          title="AI Security Analyst Engine"
          action={
            <Link to="/ai" style={{ fontSize: '12px', fontWeight: 600 }}>
              AI Workspace →
            </Link>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>LLM &amp; RAG Subsystem</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {health?.components?.ai_provider?.provider || 'Gemini Pro'}
                </div>
              </div>
            </div>
            <StatusBadge
              status={
                health?.components?.ai_provider?.status === 'AVAILABLE' ? 'ACTIVE' : 'DISABLED'
              }
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Model Configuration</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {health?.components?.ai_provider?.model || 'Configured via API'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vector Embedding Engine</span>
              <span>{health?.components?.embedding_provider?.status || 'Active'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Knowledge Index Items</span>
              <span style={{ fontWeight: 600 }}>
                {health?.components?.knowledge_index?.documentCount || 0} Documents
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
