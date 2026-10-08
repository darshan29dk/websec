import React, { useEffect, useState } from 'react';
import { toolsApi, SecurityToolStatus } from '../services/api/toolsApi';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Activity,
  Layers,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface ToolPurposeMeta {
  purpose: string;
  stage: string;
  description: string;
}

const TOOL_META: Record<string, ToolPurposeMeta> = {
  Nmap: {
    purpose: 'Port and service discovery',
    stage: 'PORT_DISCOVERY',
    description: 'Scans target IP/host for open ports, running services, and service banners using conservative non-intrusive timing.',
  },
  WhatWeb: {
    purpose: 'Technology fingerprinting',
    stage: 'TECHNOLOGY_DISCOVERY',
    description: 'Fingerprints CMS engines, web frameworks, server software, and client-side JavaScript packages.',
  },
  HttpSecurity: {
    purpose: 'HTTP transport & security header validation',
    stage: 'HTTP_SECURITY_ANALYSIS',
    description: 'Inspects HSTS, Content-Security-Policy, X-Frame-Options, Cookie SameSite/Secure flags, and TLS ciphers.',
  },
  Nikto: {
    purpose: 'Web server & configuration assessment',
    stage: 'WEB_SERVER_ASSESSMENT',
    description: 'Scans web servers for dangerous files, outdated server programs, and default configuration exposures.',
  },
  Nuclei: {
    purpose: 'Approved vulnerability template assessment',
    stage: 'VULNERABILITY_ASSESSMENT',
    description: 'Executes community-reviewed, allowlisted vulnerability templates against discovered services and endpoints.',
  },
  'OWASP ZAP': {
    purpose: 'Controlled web application security analysis',
    stage: 'HTTP_SECURITY_ANALYSIS',
    description: 'Passive and controlled active scanning for OWASP Top 10 vulnerabilities including injection and auth flaws.',
  },
  ffuf: {
    purpose: 'Controlled directory and endpoint discovery',
    stage: 'HTTP_SECURITY_ANALYSIS',
    description: 'Fast web fuzzer used for discovering exposed directories, backup files, and unlinked endpoints.',
  },
  Amass: {
    purpose: 'Subdomain and DNS boundary enumeration',
    stage: 'DNS_DISCOVERY',
    description: 'In-scope DNS discovery and domain asset mapping using passive network queries.',
  },
};

export const SecurityToolsPage: React.FC = () => {
  const [tools, setTools] = useState<SecurityToolStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<SecurityToolStatus | null>(null);
  const [recheckingTool, setRecheckingTool] = useState<string | null>(null);
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

  const handleCheckSingle = async (toolName: string) => {
    setRecheckingTool(toolName);
    try {
      const res = await toolsApi.checkToolHealth(toolName);
      setTools((prev) => prev.map((t) => (t.toolName === toolName ? res : t)));
      if (selectedTool && selectedTool.toolName === toolName) {
        setSelectedTool(res);
      }
    } catch {
      // Ignore
    } finally {
      setRecheckingTool(null);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
            AVAILABLE
          </span>
        );
      case 'NOT_AVAILABLE':
        return (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
            NOT AVAILABLE
          </span>
        );
      case 'NOT_CONFIGURED':
        return (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
            NOT RUN / CONFIGURED
          </span>
        );
      default:
        return <StatusBadge status="FAILED" customLabel={status} />;
    }
  };

  const availableCount = tools.filter((t) => t.status === 'AVAILABLE').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
            Security Tool Ecosystem
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Managed tool adapters, executable binary availability, and health checks for authorized security operations
          </p>
        </div>
        <Button onClick={handleRecheckAll} disabled={isRefreshing} icon={<RefreshCw size={14} />}>
          {isRefreshing ? 'Checking Tools...' : 'Re-check All Tools'}
        </Button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', marginBottom: '20px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Integrated Adapters
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '6px' }}>
            {tools.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            All allowlisted security tools
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Operational in System PATH
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
            {availableCount}
          </div>
          <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
            Ready for assessment execution
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Pending Executables
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: tools.length - availableCount > 0 ? '#ea580c' : '#15803d', marginTop: '6px' }}>
            {tools.length - availableCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Not detected in host PATH
          </div>
        </Card>
      </div>

      {/* Tool Table */}
      <Card title="Allowlisted Security Tool Adapters" subtitle="Click any tool to inspect diagnostic parameters and health details">
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Scanning environment for security tools...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px' }}>Tool Name</th>
                  <th style={{ padding: '12px 16px' }}>Purpose</th>
                  <th style={{ padding: '12px 16px' }}>Stage</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Last Check</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => {
                  const meta = TOOL_META[tool.toolName] || {
                    purpose: tool.supportedOperations || 'Security assessment tool',
                    stage: 'ASSESSMENT',
                    description: 'Controlled security tool adapter.',
                  };

                  return (
                    <tr
                      key={tool.toolName}
                      onClick={() => setSelectedTool(tool)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-light)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Terminal size={15} color="var(--accent-primary)" />
                          <span>{tool.toolName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                        {meta.purpose}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px' }}>
                          {meta.stage}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getStatusBadge(tool.status)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {tool.lastCheckedAt ? new Date(tool.lastCheckedAt).toLocaleTimeString() : 'Recent'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckSingle(tool.toolName);
                          }}
                          disabled={recheckingTool === tool.toolName}
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
                          {recheckingTool === tool.toolName ? 'Checking...' : 'Check Health'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tool Detail Modal (Requirement 9) */}
      {selectedTool && (
        <Modal
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          title={`Security Tool Diagnostics: ${selectedTool.toolName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tool Adapter: </span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-heading)' }}>
                  {selectedTool.toolName}
                </span>
              </div>
              {getStatusBadge(selectedTool.status)}
            </div>

            {/* Purpose & Description */}
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                {TOOL_META[selectedTool.toolName]?.purpose || selectedTool.supportedOperations}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                {TOOL_META[selectedTool.toolName]?.description || 'Controlled tool executed through secure ProcessBuilder allowlist.'}
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Executable Binary: </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTool.executablePath || selectedTool.toolName.toLowerCase()}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status State: </span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {selectedTool.status === 'AVAILABLE' ? 'Operational in Host PATH' : 'Unavailable in Host PATH'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Command Allowlisting: </span>
                <div style={{ fontWeight: 600, color: '#15803d', marginTop: '2px' }}>
                  Enforced (No arbitrary commands)
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Last Health Verification: </span>
                <div style={{ marginTop: '2px' }}>
                  {selectedTool.lastCheckedAt ? new Date(selectedTool.lastCheckedAt).toLocaleString() : 'System Boot'}
                </div>
              </div>
            </div>

            {/* Unavailable Reason explanation */}
            {selectedTool.status !== 'AVAILABLE' && (
              <div style={{ padding: '12px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b' }}>
                  Why is this tool unavailable?
                </div>
                <div style={{ fontSize: '11.5px', color: '#991b1b', marginTop: '4px', lineHeight: '1.4' }}>
                  The executable binary <code>{selectedTool.executablePath || selectedTool.toolName.toLowerCase()}</code> was not detected on the operating system PATH. If assessments require this tool, ensure the binary is installed on the host and in system PATH.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button
                variant="secondary"
                onClick={() => handleCheckSingle(selectedTool.toolName)}
                disabled={recheckingTool === selectedTool.toolName}
              >
                {recheckingTool === selectedTool.toolName ? 'Rechecking...' : 'Recheck Health'}
              </Button>
              <Button variant="primary" onClick={() => setSelectedTool(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
