import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  History,
  Activity,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  FileText,
  Clock,
  Target as TargetIcon,
  RefreshCw,
} from 'lucide-react';
import { historyApi } from '../services/api/historyApi';
import { targetApi } from '../services/api/targetApi';
import { SecurityTarget } from '../types/target';
import { SecurityHistoryTimelineDto, TimelineEventItem } from '../types/history';

export const SecurityHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetIdFromUrl = searchParams.get('targetId') || '';

  const [targets, setTargets] = useState<SecurityTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetIdFromUrl);
  const [history, setHistory] = useState<SecurityHistoryTimelineDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTargets();
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      loadHistory(selectedTargetId);
    }
  }, [selectedTargetId]);

  const loadTargets = async () => {
    try {
      const res = await targetApi.listTargets();
      setTargets(res);
      if (res.length > 0) {
        if (targetIdFromUrl && res.some((t) => t.id === targetIdFromUrl)) {
          setSelectedTargetId(targetIdFromUrl);
        } else {
          setSelectedTargetId(res[0].id);
        }
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load targets');
      setLoading(false);
    }
  };

  const loadHistory = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await historyApi.getTargetSecurityHistory(targetId);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load target security history');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (category: string) => {
    switch (category) {
      case 'ASSESSMENT':
        return <Activity size={14} style={{ color: 'var(--brand-primary)' }} />;
      case 'FINDING_CHANGE':
        return <AlertTriangle size={14} style={{ color: '#d97706' }} />;
      case 'DEFENSE_VALIDATION':
        return <ShieldCheck size={14} style={{ color: '#059669' }} />;
      case 'REGRESSION':
        return <RotateCcw size={14} style={{ color: '#e11d48' }} />;
      default:
        return <Clock size={14} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={22} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Target Security History Timeline
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Immutable chronological security log across assessments, findings, retests, and posture shifts.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {targets.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TargetIcon size={16} style={{ color: 'var(--brand-primary)' }} />
              <select
                value={selectedTargetId}
                onChange={(e) => {
                  setSelectedTargetId(e.target.value);
                  setSearchParams({ targetId: e.target.value });
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.primaryUrl})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadHistory(selectedTargetId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: '#f0f7ff',
              border: '1px solid var(--border-subtle)',
              color: 'var(--brand-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
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

      {/* Main Timeline Stream */}
      {loading ? (
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
          <div>Loading security history timeline...</div>
        </div>
      ) : !history || history.events.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <Clock size={36} style={{ color: 'var(--brand-primary)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            No Security History Events Recorded
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto' }}>
            Historical security milestones will automatically log as assessments, retests, and posture updates occur against this target.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Score Summary Banner */}
          <div
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '18px 22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {history.targetName}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                {history.primaryUrl}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                {history.currentScore} / 100
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Risk Tier: {history.currentRiskLevel}
              </div>
            </div>
          </div>

          {/* Timeline Events Ledger */}
          <div
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Chronological Security Milestone Log ({history.events.length})
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderLeft: '2px solid #e2e8f0',
                marginLeft: '12px',
                paddingLeft: '18px',
              }}
            >
              {history.events.map((ev: TimelineEventItem) => (
                <div
                  key={ev.eventId}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-26px',
                      top: '14px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '2px solid var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getEventIcon(ev.category)}
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ev.title}
                      </h4>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {ev.summary}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        textTransform: 'uppercase',
                      }}
                    >
                      {ev.category}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {ev.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
