import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attackSurfaceApi } from '../services/api/attackSurfaceApi';
import {
  AttackSurfaceSummary,
  AttackSurfaceAsset,
  AttackSurfaceRelationship,
  Technology,
  WebEndpoint,
} from '../types/attackSurface';
import { Shield, Server, Globe, Cpu, Layers, GitBranch, Terminal } from 'lucide-react';

export const AttackSurfacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId') || '';

  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'technologies' | 'endpoints' | 'relationships'>('overview');
  const [summary, setSummary] = useState<AttackSurfaceSummary | null>(null);
  const [assets, setAssets] = useState<AttackSurfaceAsset[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [endpoints, setEndpoints] = useState<WebEndpoint[]>([]);
  const [relationships, setRelationships] = useState<AttackSurfaceRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (assessmentId) {
      loadData();
    }
  }, [assessmentId]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const sumRes = await attackSurfaceApi.getSummary(assessmentId);
      if (sumRes) setSummary(sumRes);

      const assetRes = await attackSurfaceApi.getAssets(assessmentId);
      if (assetRes && assetRes.content) setAssets(assetRes.content);

      const techRes = await attackSurfaceApi.getTechnologies(assessmentId);
      if (techRes && techRes.content) setTechnologies(techRes.content);

      const epRes = await attackSurfaceApi.getEndpoints(assessmentId);
      if (epRes && epRes.content) setEndpoints(epRes.content);

      const relRes = await attackSurfaceApi.getRelationships(assessmentId);
      if (relRes && relRes.content) setRelationships(relRes.content);
    } catch (err: any) {
      setError(err.message || 'Failed to load attack surface data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            Attack Surface Inventory & Topology
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Discovered target assets, host exposure, technology stack, and entity relationships
          </p>
        </div>
      </div>

      {!assessmentId && (
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Select an assessment from the Assessments page to view its dedicated Attack Surface discovery model.
          </p>
        </div>
      )}

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={14} /> Total Assets
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
            {summary?.totalAssets || 0}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} /> Technologies
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
            {summary?.totalTechnologies || 0}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} /> Web Apps
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
            {summary?.totalWebApplications || 0}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} /> Endpoints
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
            {summary?.totalEndpoints || 0}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} /> API Endpoints
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
            {summary?.totalApiEndpoints || 0}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitBranch size={14} /> Relationships
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
            {summary?.totalRelationships || 0}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {(['overview', 'assets', 'technologies', 'endpoints', 'relationships'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'capitalize',
              color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '16px' }}>
              Detected Technology Stack
            </h3>
            {technologies.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No technologies detected yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {technologies.map((tech) => (
                  <div key={tech.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{tech.name} {tech.version && `(${tech.version})`}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-dark)', padding: '2px 8px', borderRadius: '4px' }}>
                      {tech.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '16px' }}>
              Host & Exposed Services
            </h3>
            {assets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No asset inventory loaded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assets.map((asset) => (
                  <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px' }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-heading)' }}>{asset.assetValue}</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>{asset.assetType}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-dark)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Value</th>
                <th style={{ padding: '12px 16px' }}>Normalized Value</th>
                <th style={{ padding: '12px 16px' }}>Source</th>
                <th style={{ padding: '12px 16px' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-heading)' }}>{a.assetType}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{a.assetValue}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{a.normalizedValue}</td>
                  <td style={{ padding: '12px 16px' }}>{a.source}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-primary)' }}>{a.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'relationships' && (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '16px' }}>
            Attack Surface Topology Graph
          </h3>
          {relationships.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Attack surface relationships are not available for this assessment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {relationships.map((rel) => (
                <div key={rel.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-heading)' }}>{rel.sourceAssetValue}</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', padding: '2px 8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                    ↓ {rel.relationshipType}
                  </span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-heading)' }}>{rel.targetAssetValue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
