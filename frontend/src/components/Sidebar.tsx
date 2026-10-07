import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target as TargetIcon,
  Activity,
  FileText,
  Server,
  Lock,
  Search,
  Bot,
  ShieldCheck,
  RotateCcw,
  BarChart2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const activeNavItems = [
    { path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/targets', label: 'Targets', icon: TargetIcon },
    { path: '/assessments', label: 'Assessments', icon: Activity },
    { path: '/attack-surface', label: 'Attack Surface', icon: Search },
    { path: '/findings', label: 'Findings', icon: Lock },
    { path: '/incidents', label: 'Incidents', icon: Activity },
    { path: '/investigations', label: 'Investigation', icon: FileText },
    { path: '/forensics', label: 'Digital Forensics', icon: Search },
    { path: '/ai', label: 'AI Security Analyst', icon: Bot },
    { path: '/knowledge', label: 'Knowledge Base', icon: FileText },
    { path: '/defense', label: 'Defense', icon: ShieldCheck },
    { path: '/remediation', label: 'Remediation', icon: RotateCcw },
    { path: '/retests', label: 'Controlled Retests', icon: RotateCcw },
    { path: '/audit', label: 'Audit Log', icon: FileText },
    { path: '/system', label: 'System', icon: Server },
  ];

  const futurePhaseItems = [
    { label: 'Security Posture', icon: BarChart2, phase: 'Phase 9' },
    { label: 'Continuous Reporting', icon: BarChart2, phase: 'Phase 10' },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        minHeight: 'calc(100vh - 56px)',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-muted)',
            marginBottom: '8px',
            paddingLeft: '12px',
          }}
        >
          Core Platform
        </div>
        {activeNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: isActive ? 'var(--text-heading)' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                marginBottom: '2px',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-muted)',
            marginBottom: '8px',
            paddingLeft: '12px',
          }}
        >
          Future Modules
        </div>
        {futurePhaseItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                opacity: 0.45,
                cursor: 'not-allowed',
                userSelect: 'none',
              }}
              title={`${item.label} will be available in ${item.phase}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={14} />
                <span>{item.label}</span>
              </div>
              <span style={{ fontSize: '9px', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '1px 4px' }}>
                {item.phase}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
