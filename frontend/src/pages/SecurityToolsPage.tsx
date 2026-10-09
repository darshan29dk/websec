import React, { useEffect, useState } from 'react';
import { toolsApi, SecurityToolStatus, ToolCategory } from '../services/api/toolsApi';
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
  Lock,
  Globe,
  Radio,
  Binary,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface ToolCategoryMeta {
  key: ToolCategory | 'ALL';
  label: string;
  count: number;
}

export const SecurityToolsPage: React.FC = () => {
  const [tools, setTools] = useState<SecurityToolStatus[]>([]);
  const [filteredTools, setFilteredTools] = useState<SecurityToolStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<SecurityToolStatus | null>(null);
  const [recheckingTool, setRecheckingTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await toolsApi.getAllTools();
      setTools(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load security tool status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecheckAll = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const updated = await toolsApi.recheckAllTools();
      setTools(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to recheck tools');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRecheckSingle = async (toolName: string) => {
    setRecheckingTool(toolName);
    try {
      const updated = await toolsApi.checkToolHealth(toolName);
      setTools((prev) => prev.map((t) => (t.toolName === updated.toolName ? updated : t)));
      if (selectedTool && selectedTool.toolName === toolName) {
        setSelectedTool(updated);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || `Failed to check ${toolName}`);
    } finally {
      setRecheckingTool(null);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    let result = tools;
    if (selectedCategory !== 'ALL') {
      result = result.filter((t) => t.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.toolName.toLowerCase().includes(q) ||
          (t.displayName && t.displayName.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.supportedOperations && t.supportedOperations.toLowerCase().includes(q)) ||
          (t.integrationType && t.integrationType.toLowerCase().includes(q))
      );
    }
    setFilteredTools(result);
  }, [tools, selectedCategory, searchQuery]);

  const categories: ToolCategoryMeta[] = [
    { key: 'ALL', label: 'All Ecosystem Tools', count: tools.length },
    { key: 'RECONNAISSANCE', label: 'Reconnaissance / Attack Surface', count: tools.filter((t) => t.category === 'RECONNAISSANCE').length },
    { key: 'WEB_SECURITY', label: 'Web Security', count: tools.filter((t) => t.category === 'WEB_SECURITY').length },
    { key: 'NETWORK_SECURITY', label: 'Network & IDS', count: tools.filter((t) => t.category === 'NETWORK_SECURITY').length },
    { key: 'BLUE_TEAM_SIEM', label: 'Blue Team / SIEM', count: tools.filter((t) => t.category === 'BLUE_TEAM_SIEM').length },
    { key: 'DIGITAL_FORENSICS', label: 'Digital Forensics', count: tools.filter((t) => t.category === 'DIGITAL_FORENSICS').length },
  ];

  const availableCount = tools.filter((t) => t.status === 'AVAILABLE').length;
  const notConfiguredCount = tools.filter((t) => t.status === 'NOT_CONFIGURED').length;
  const notAvailableCount = tools.filter((t) => t.status === 'NOT_AVAILABLE').length;

  const getCategoryIcon = (category: ToolCategory) => {
    switch (category) {
      case 'RECONNAISSANCE':
        return <Globe size={16} style={{ color: '#3b82f6' }} />;
      case 'WEB_SECURITY':
        return <Shield size={16} style={{ color: '#8b5cf6' }} />;
      case 'NETWORK_SECURITY':
        return <Radio size={16} style={{ color: '#10b981' }} />;
      case 'BLUE_TEAM_SIEM':
        return <Layers size={16} style={{ color: '#f59e0b' }} />;
      case 'DIGITAL_FORENSICS':
        return <Binary size={16} style={{ color: '#ec4899' }} />;
      default:
        return <Terminal size={16} />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'NOT_CONFIGURED':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'NOT_AVAILABLE':
      case 'FAILED':
      default:
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-heading, #f8fafc)' }}>
            Security Ecosystem &amp; Tool Integration Registry
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>
            Enterprise security adapters, telemetry ingestors, SIEM connectors, and digital forensic engines across all 25 registered tools
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecheckAll}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw size={14} style={{ marginRight: 6, animation: isRefreshing ? 'spin 1s linear infinite' : undefined }} />
            {isRefreshing ? 'Verifying Host & Connectors...' : 'Verify All Integrations'}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL REGISTERED</span>
            <Terminal size={18} style={{ color: 'var(--color-primary, #3b82f6)' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--text-main, #f1f5f9)' }}>
            {tools.length} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Tools</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>5 Security Disciplines</div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>OPERATIONAL / AVAILABLE</span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: '#34d399' }}>
            {availableCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Host PATH or verified connector</div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>CONFIGURATION REQUIRED</span>
            <AlertCircle size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: '#fbbf24' }}>
            {notConfiguredCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Awaiting API key / tenant credentials</div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>NOT INSTALLED IN PATH</span>
            <XCircle size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: '#f87171' }}>
            {notAvailableCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>CLI binary absent on host system</div>
        </Card>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: selectedCategory === cat.key ? 600 : 500,
                  backgroundColor: selectedCategory === cat.key ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedCategory === cat.key ? '#60a5fa' : 'var(--text-muted)',
                  border: selectedCategory === cat.key ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 10,
                    backgroundColor: selectedCategory === cat.key ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter by tool, category, operation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: 12,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tools Table / Catalog */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>TOOL NAME</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>CATEGORY</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>INTEGRATION TYPE</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>HOST / ENDPOINT PATH</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>AUTHORIZATION</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No security tools matched the active search or category criteria.
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => {
                  const statusStyle = getStatusStyle(tool.status);
                  return (
                    <tr
                      key={tool.toolName}
                      onClick={() => setSelectedTool(tool)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {getCategoryIcon(tool.category)}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main, #f1f5f9)' }}>
                              {tool.toolName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tool.description || tool.supportedOperations}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{tool.category.replace('_', ' ')}</span>
                      </td>

                      {/* Integration Type */}
                      <td style={{ padding: '12px 16px', fontSize: 11 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-main)',
                          }}
                        >
                          {tool.integrationType}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            border: statusStyle.border,
                          }}
                        >
                          {tool.status}
                        </span>
                      </td>

                      {/* Path */}
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>
                        <div style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tool.executablePath || 'N/A'}
                        </div>
                      </td>

                      {/* Authorization */}
                      <td style={{ padding: '12px 16px', fontSize: 11 }}>
                        {tool.authorizationRequired ? (
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>MANDATORY</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>INGESTION</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={recheckingTool === tool.toolName}
                            onClick={() => handleRecheckSingle(tool.toolName)}
                            title="Verify tool health"
                          >
                            <RefreshCw
                              size={12}
                              style={{ animation: recheckingTool === tool.toolName ? 'spin 1s linear infinite' : undefined }}
                            />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTool(tool)}>
                            Inspect
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tool Detail Inspection Modal */}
      {selectedTool && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTool(null)}
          title={`${selectedTool.toolName} — Integration Architecture`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Status Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 6,
                ...getStatusStyle(selectedTool.status),
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Availability Status: {selectedTool.status}
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  {selectedTool.configurationStatus || 'Verification executed against server environment'}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRecheckSingle(selectedTool.toolName)}
                disabled={recheckingTool === selectedTool.toolName}
              >
                <RefreshCw size={12} style={{ marginRight: 6 }} /> Re-verify
              </Button>
            </div>

            {/* Core Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div style={{ padding: 12, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>SECURITY CATEGORY</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedTool.category}</strong>
              </div>
              <div style={{ padding: 12, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>INTEGRATION TYPE</span>
                <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-main)' }}>
                  {selectedTool.integrationType}
                </strong>
              </div>
              <div style={{ padding: 12, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>EXECUTABLE / ENDPOINT PATH</span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--text-main)' }}>
                  {selectedTool.executablePath || 'Not configured in environment'}
                </span>
              </div>
              <div style={{ padding: 12, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>AUTHORIZATION REQUIREMENT</span>
                <strong style={{ color: selectedTool.authorizationRequired ? '#f59e0b' : '#10b981' }}>
                  {selectedTool.authorizationRequired ? 'MANDATORY (Scoped Authorization Record Required)' : 'TELEMETRY / INGESTION (Passive Telemetry Stream)'}
                </strong>
              </div>
            </div>

            {/* Description & Operations */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Tool Purpose &amp; Capability
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
                {selectedTool.description}
              </p>

              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Allowlisted Operations
              </h4>
              <div style={{ padding: 10, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', fontSize: 12, color: 'var(--text-main)' }}>
                {selectedTool.supportedOperations || 'Non-destructive security reconnaissance and analysis'}
              </div>
            </div>

            {/* Architecture Pipeline Position */}
            <div style={{ padding: 12, borderRadius: 6, backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Info size={14} style={{ color: '#60a5fa' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>GlobalShield Server-Side Execution Guarantee</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                GlobalShield never executes arbitrary shell commands or user-supplied command strings. This tool runs strictly through a dedicated server-side adapter (<code>com.globalshield.security.tool.{selectedTool.toolName.replace(/\s+/g, '')}Adapter</code>) bounded by strict timeouts, scope validation, and allowlisted arguments.
              </p>
            </div>

            {/* Last Checked */}
            {selectedTool.lastCheckedAt && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                Last health check verified: {new Date(selectedTool.lastCheckedAt).toLocaleString()}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
export default SecurityToolsPage;
