import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Target, Lock, AlertTriangle, FileText, X } from 'lucide-react';
import { targetApi } from '../services/api/targetApi';
import { findingApi } from '../services/api/findingApi';
import { incidentApi } from '../services/api/incidentApi';
import { reportApi } from '../services/api/reportApi';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    targets: any[];
    findings: any[];
    incidents: any[];
    reports: any[];
  }>({
    targets: [],
    findings: [],
    incidents: [],
    reports: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ targets: [], findings: [], incidents: [], reports: [] });
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [targetData, findingData, incidentData, reportData] = await Promise.all([
          targetApi.getTargets(0, 5).catch(() => ({ content: [] })),
          findingApi.getFindings(0, 10).catch(() => ({ content: [] } as any)),
          incidentApi.getIncidents(0, 10).catch(() => ({ content: [] } as any)),
          reportApi.searchReports(undefined, undefined, undefined, undefined, 0, 5).catch(() => ({ content: [] })),
        ]);

        const q = query.toLowerCase();
        const targetsList = targetData.content || [];
        const findingsList = (findingData as any)?.content || [];
        const incidentsList = (incidentData as any)?.content || [];
        const reportsList = reportData.content || [];

        setResults({
          targets: targetsList.filter(
            (t: any) => t.name?.toLowerCase().includes(q) || t.primaryUrl?.toLowerCase().includes(q)
          ),
          findings: findingsList.filter(
            (f: any) => f.title?.toLowerCase().includes(q) || f.affectedUrl?.toLowerCase().includes(q)
          ),
          incidents: incidentsList.filter(
            (i: any) => i.title?.toLowerCase().includes(q) || i.summary?.toLowerCase().includes(q)
          ),
          reports: reportsList.filter(
            (r: any) => r.title?.toLowerCase().includes(q) || r.targetName?.toLowerCase().includes(q)
          ),
        });
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(searchTimer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  const hasResults =
    results.targets.length > 0 ||
    results.findings.length > 0 ||
    results.incidents.length > 0 ||
    results.reports.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid #1e293b',
            gap: '12px',
          }}
        >
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search targets, findings, incidents, reports... (Press Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '14px',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px 16px' }}>
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Searching security intelligence...
            </div>
          ) : !query.trim() ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Type at least 2 characters to search across GlobalShield platform entities.
            </div>
          ) : !hasResults ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No security assets or findings matched "{query}".
            </div>
          ) : (
            <div>
              {/* Targets Section */}
              {results.targets.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    Authorized Targets
                  </div>
                  {results.targets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelect(`/targets/${t.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#cbd5e1',
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Target size={15} color="#3b82f6" />
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{t.name}</span>
                      <code style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
                        {t.primaryUrl}
                      </code>
                    </div>
                  ))}
                </div>
              )}

              {/* Findings Section */}
              {results.findings.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    Vulnerability Findings
                  </div>
                  {results.findings.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => handleSelect(`/findings/${f.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#cbd5e1',
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Lock size={15} color="#f59e0b" />
                      <span style={{ fontWeight: 500, color: '#f8fafc' }}>{f.title}</span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            f.severity === 'CRITICAL'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : f.severity === 'HIGH'
                              ? 'rgba(249, 115, 22, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            f.severity === 'CRITICAL'
                              ? '#ef4444'
                              : f.severity === 'HIGH'
                              ? '#f97316'
                              : '#f59e0b',
                        }}
                      >
                        {f.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Incidents Section */}
              {results.incidents.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    Security Incidents
                  </div>
                  {results.incidents.map((i) => (
                    <div
                      key={i.id}
                      onClick={() => handleSelect(`/incidents/${i.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#cbd5e1',
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <AlertTriangle size={15} color="#ef4444" />
                      <span style={{ fontWeight: 500, color: '#f8fafc' }}>{i.title}</span>
                      <code style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
                        {i.incidentNumber}
                      </code>
                    </div>
                  ))}
                </div>
              )}

              {/* Reports Section */}
              {results.reports.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    Assessment Reports
                  </div>
                  {results.reports.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelect(`/reports`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#cbd5e1',
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <FileText size={15} color="#10b981" />
                      <span style={{ fontWeight: 500, color: '#f8fafc' }}>{r.title}</span>
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
                        {r.targetName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
