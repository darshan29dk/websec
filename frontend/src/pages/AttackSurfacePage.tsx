import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attackSurfaceApi } from '../services/api/attackSurfaceApi';
import { assessmentApi } from '../services/api/assessmentApi';
import {
  AttackSurfaceSummary,
  AttackSurfaceAsset,
  AttackSurfaceRelationship,
  Technology,
  WebEndpoint,
} from '../types/attackSurface';
import { Assessment } from '../types/assessment';
import {
  Server,
  Globe,
  Cpu,
  Layers,
  GitBranch,
  Terminal,
  Shield,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  Database,
  ExternalLink,
} from 'lucide-react';

export const AttackSurfacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const assessmentIdFromUrl = searchParams.get('assessmentId') || '';

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(assessmentIdFromUrl);

  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'technologies' | 'endpoints' | 'relationships'>('overview');
  const [summary, setSummary] = useState<AttackSurfaceSummary | null>(null);
  const [assets, setAssets] = useState<AttackSurfaceAsset[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [endpoints, setEndpoints] = useState<WebEndpoint[]>([]);
  const [relationships, setRelationships] = useState<AttackSurfaceRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssessmentsList();
  }, []);

  const loadAssessmentsList = async () => {
    try {
      const res = await assessmentApi.listAssessments();
      const items = res.content || [];
      setAssessments(items);
      if (!selectedAssessmentId && items.length > 0) {
        setSelectedAssessmentId(items[0].id);
      }
    } catch (err) {
      console.error('Failed to load assessments for attack surface:', err);
    }
  };

  useEffect(() => {
    if (selectedAssessmentId) {
      loadData(selectedAssessmentId);
    }
  }, [selectedAssessmentId]);

  const loadData = async (aId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const [sumRes, assetRes, techRes, epRes, relRes] = await Promise.all([
        attackSurfaceApi.getSummary(aId).catch(() => null),
        attackSurfaceApi.getAssets(aId).catch(() => null),
        attackSurfaceApi.getTechnologies(aId).catch(() => null),
        attackSurfaceApi.getEndpoints(aId).catch(() => null),
        attackSurfaceApi.getRelationships(aId).catch(() => null),
      ]);

      if (sumRes) setSummary(sumRes);
      if (assetRes?.content) setAssets(assetRes.content);
      if (techRes?.content) setTechnologies(techRes.content);
      if (epRes?.content) setEndpoints(epRes.content);
      if (relRes?.content) setRelationships(relRes.content);
    } catch (err: any) {
      setError(err.message || 'Failed to load attack surface data');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodBadgeStyle = (method?: string) => {
    const m = (method || 'GET').toUpperCase();
    switch (m) {
      case 'GET':
        return { bg: '#eff6ff', text: '#0284c7', border: '#bae6fd' };
      case 'POST':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'PUT':
      case 'PATCH':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'DELETE':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' };
      default:
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  const getStatusBadgeStyle = (status?: number) => {
    const s = status || 200;
    if (s >= 200 && s < 300) {
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    }
    if (s >= 300 && s < 400) {
      return { bg: '#eff6ff', text: '#0284c7', border: '#bae6fd' };
    }
    if (s >= 400 && s < 500) {
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    }
    return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '36px' }}>
      {/* Top Header Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '22px 26px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 10px rgba(2, 132, 199, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
              border: '1px solid #7dd3fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)',
            }}
          >
            <Shield size={24} style={{ color: '#0284c7' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Attack Surface Inventory & Topology
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                }}
              >
                ASSET MAP
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Discovered target host exposure, technology stacks, mapped endpoints, and relational entity topology.
            </p>
          </div>
        </div>

        {/* Right Corner Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {assessments.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Assessment:
              </span>
              <select
                value={selectedAssessmentId}
                onChange={(e) => {
                  setSelectedAssessmentId(e.target.value);
                  setSearchParams({ assessmentId: e.target.value });
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  outline: 'none',
                }}
              >
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Assessment #{a.id.substring(0, 8)} ({a.targetName || 'Target'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => selectedAssessmentId && loadData(selectedAssessmentId)}
            title="Refresh Attack Surface Data"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--brand-primary)';
              e.currentTarget.style.color = 'var(--brand-primary)';
              e.currentTarget.style.backgroundColor = '#f0f9ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#dc2626',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        {[
          {
            label: 'Total Assets',
            val: summary?.totalAssets ?? assets.length,
            icon: <Server size={18} />,
            bg: '#f0f9ff',
            color: '#0284c7',
            border: '#bae6fd',
          },
          {
            label: 'Technologies',
            val: summary?.totalTechnologies ?? technologies.length,
            icon: <Cpu size={18} />,
            bg: '#f0fdf4',
            color: '#059669',
            border: '#a7f3d0',
          },
          {
            label: 'Web Applications',
            val: summary?.totalWebApplications ?? (assets.some((a) => a.assetType === 'WEB_APPLICATION') ? 1 : 1),
            icon: <Layers size={18} />,
            bg: '#faf5ff',
            color: '#7c3aed',
            border: '#e9d5ff',
          },
          {
            label: 'Endpoints',
            val: summary?.totalEndpoints ?? endpoints.length,
            icon: <Globe size={18} />,
            bg: '#f0f9ff',
            color: '#0369a1',
            border: '#bae6fd',
          },
          {
            label: 'API Endpoints',
            val: summary?.totalApiEndpoints ?? endpoints.filter((e) => e.endpointType === 'API').length,
            icon: <Terminal size={18} />,
            bg: '#fffbeb',
            color: '#d97706',
            border: '#fde68a',
          },
          {
            label: 'Relationships',
            val: summary?.totalRelationships ?? relationships.length,
            icon: <GitBranch size={18} />,
            bg: '#fff1f2',
            color: '#e11d48',
            border: '#fecdd3',
          },
        ].map((m, idx) => (
          <div
            key={idx}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px 18px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {m.label}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: m.bg,
                  border: `1px solid ${m.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: m.color,
                }}
              >
                {m.icon}
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {m.val}
            </div>
          </div>
        ))}
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          padding: '6px',
          display: 'flex',
          gap: '6px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          flexWrap: 'wrap',
        }}
      >
        {[
          { id: 'overview', label: 'Topology Overview', icon: <Layers size={14} />, count: null },
          { id: 'assets', label: 'Discovered Assets', icon: <Server size={14} />, count: assets.length },
          { id: 'technologies', label: 'Technology Stack', icon: <Cpu size={14} />, count: technologies.length },
          { id: 'endpoints', label: 'Web Endpoints', icon: <Globe size={14} />, count: endpoints.length },
          { id: 'relationships', label: 'Graph Topology', icon: <GitBranch size={14} />, count: relationships.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? '1px solid #7dd3fc' : '1px solid transparent',
                background: isActive ? '#f0f9ff' : 'transparent',
                color: isActive ? '#0284c7' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 1px 3px rgba(2, 132, 199, 0.12)' : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? '#bae6fd' : '#e2e8f0',
                    color: isActive ? '#0369a1' : '#475569',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {isLoading ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            padding: '56px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={26} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
          <div style={{ fontWeight: 600 }}>Analyzing attack surface inventory...</div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
              {/* Tech Fingerprints Card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '20px 22px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={18} style={{ color: 'var(--brand-primary)' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Technology Fingerprints ({technologies.length})
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fingerprinted Components</span>
                </div>

                {technologies.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No technology signatures detected yet for this assessment run.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {technologies.map((tech) => (
                      <div
                        key={tech.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '13px',
                          background: '#f8fafc',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {tech.name}
                          </span>
                          {tech.version && (
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#e2e8f0', color: '#334155', padding: '1px 6px', borderRadius: '4px' }}>
                              v{tech.version}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#0284c7',
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}
                        >
                          {tech.category || 'General'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discovered Assets Card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '20px 22px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={18} style={{ color: 'var(--brand-primary)' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Discovered Host Assets ({assets.length})
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Network Hosts</span>
                </div>

                {assets.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No host asset inventory loaded. Run an assessment to populate target hosts.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '13px',
                          background: '#f8fafc',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      >
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {asset.assetValue}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#0369a1',
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}
                        >
                          {asset.assetType}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={16} style={{ color: 'var(--brand-primary)' }} />
                  <span>Target Assets & Subdomains ({assets.length})</span>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Asset Type</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Discovered Value</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Canonical Form</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Discovery Source</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No assets discovered for this assessment.
                      </td>
                    </tr>
                  ) : (
                    assets.map((a) => (
                      <tr
                        key={a.id}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px 18px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                            }}
                          >
                            {a.assetType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {a.assetValue}
                        </td>
                        <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {a.normalizedValue || '—'}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                            {a.source}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ fontSize: '11px', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            {a.confidence || 'HIGH'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'technologies' && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={16} style={{ color: 'var(--brand-primary)' }} />
                  <span>Detected Technology Stack ({technologies.length})</span>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Technology</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Category</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Identified Version</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {technologies.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No technology signatures detected.
                      </td>
                    </tr>
                  ) : (
                    technologies.map((t) => (
                      <tr
                        key={t.id}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '4px' }}>
                            {t.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {t.version || 'Unspecified'}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ fontSize: '11px', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            {t.confidence || 'HIGH'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={16} style={{ color: 'var(--brand-primary)' }} />
                  <span>Discovered Web Endpoints ({endpoints.length})</span>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>HTTP Method</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Path / URL</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Endpoint Type</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Parameters</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No endpoints indexed for this assessment.
                      </td>
                    </tr>
                  ) : (
                    endpoints.map((ep) => {
                      const methodStyle = getMethodBadgeStyle(ep.method);
                      const statusStyle = getStatusBadgeStyle(ep.statusCode);
                      return (
                        <tr
                          key={ep.id}
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '12px 18px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: methodStyle.bg,
                                color: methodStyle.text,
                                border: `1px solid ${methodStyle.border}`,
                              }}
                            >
                              {ep.method || 'GET'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                            {ep.path || ep.url}
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: statusStyle.bg,
                                color: statusStyle.text,
                                border: `1px solid ${statusStyle.border}`,
                              }}
                            >
                              {ep.statusCode || 200}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: ep.endpointType === 'API' ? '#eff6ff' : '#f1f5f9',
                                color: ep.endpointType === 'API' ? '#0284c7' : '#64748b',
                                border: `1px solid ${ep.endpointType === 'API' ? '#bae6fd' : '#e2e8f0'}`,
                              }}
                            >
                              {ep.endpointType || 'WEB'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {ep.parametersPresent ? (
                              <span style={{ color: '#0284c7', fontWeight: 600 }}>YES</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>NONE</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'relationships' && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '24px 26px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GitBranch size={18} style={{ color: 'var(--brand-primary)' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Attack Surface Topology Graph ({relationships.length} edges)
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Discovered Entity Connections</span>
              </div>

              {relationships.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No attack surface relationship edges discovered for this assessment run.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relationships.map((rel) => (
                    <div
                      key={rel.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        background: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {rel.sourceAssetValue}
                        </span>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: '#0284c7',
                            padding: '3px 10px',
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                            fontWeight: 700,
                          }}
                        >
                          <span>{rel.relationshipType}</span>
                          <ArrowRight size={12} />
                        </div>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {rel.targetAssetValue}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Edge ID: #{rel.id.substring(0, 8)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
