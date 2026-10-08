import React, { useEffect, useState } from 'react';
import { toolsApi, SecurityToolStatus } from '../services/api/toolsApi';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Server, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const SecurityToolsPage: React.FC = () => {
  const [tools, setTools] = useState<SecurityToolStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await toolsApi.getAllTools();
      setTools(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load security tool status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecheckAll = async () => {
    setIsRefreshing(true);
    try {
      const updated = await toolsApi.recheckAllTools();
      setTools(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to recheck tools');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <StatusBadge status="ACTIVE" customLabel="AVAILABLE" />;
      case 'NOT_AVAILABLE':
        return <StatusBadge status="FAILED" customLabel="NOT AVAILABLE" />;
      case 'NOT_CONFIGURED':
        return <StatusBadge status="DISABLED" customLabel="NOT CONFIGURED" />;
      default:
        return <StatusBadge status="FAILED" customLabel={status} />;
    }
  };

  const availableCount = tools.filter((t) => t.status === 'AVAILABLE').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
            Security Tool Ecosystem
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Managed tool adapters, executable availability, and health status for authorized security operations.
          </p>
        </div>
        <Button onClick={handleRecheckAll} disabled={isRefreshing} icon={<RefreshCw size={14} />}>
          {isRefreshing ? 'Checking Tools...' : 'Re-check All Tools'}
        </Button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', borderRadius: '6px', color: 'var(--status-danger-text)', marginBottom: '20px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL INTEGRATED TOOLS</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '8px' }}>
            {tools.length}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABLE IN PATH</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', marginTop: '8px' }}>
            {availableCount}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>NOT INSTALLED / CONFIGURED</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#eab308', marginTop: '8px' }}>
            {tools.length - availableCount}
          </div>
        </Card>
      </div>

      <Card>
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Scanning environment for security tools...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Tool Name</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Executable Path</th>
                  <th style={{ padding: '12px 16px' }}>Supported Operations</th>
                  <th style={{ padding: '12px 16px' }}>Configuration / Details</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.toolName} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {tool.toolName}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {getStatusBadge(tool.status)}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {tool.executablePath || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontSize: '12px' }}>
                      {tool.supportedOperations || 'Authorized operations'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {tool.configurationStatus || 'Standard execution profile'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
