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
  AlertTriangle,
  Radio,
  Sliders,
  History,
  Terminal,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const sections = [
    {
      title: 'Security Operations',
      items: [
        { path: '/overview', label: 'Overview', icon: LayoutDashboard },
        { path: '/targets', label: 'Targets', icon: TargetIcon },
        { path: '/assessments', label: 'Assessments', icon: Activity },
        { path: '/attack-surface', label: 'Attack Surface', icon: Search },
        { path: '/findings', label: 'Findings', icon: Lock },
      ],
    },
    {
      title: 'Incident Response',
      items: [
        { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
        { path: '/investigations', label: 'Investigation', icon: FileText },
        { path: '/forensics', label: 'Digital Forensics', icon: Search },
      ],
    },
    {
      title: 'Defense & Retesting',
      items: [
        { path: '/defense', label: 'Defense Center', icon: ShieldCheck },
        { path: '/remediation', label: 'Remediation', icon: RotateCcw },
        { path: '/retests', label: 'Controlled Retests', icon: RotateCcw },
        { path: '/posture', label: 'Security Posture', icon: BarChart2 },
        { path: '/regressions', label: 'Regression Center', icon: RotateCcw },
        { path: '/compare', label: 'Compare Assessments', icon: Sliders },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        { path: '/ai', label: 'AI Security Analyst', icon: Bot },
        { path: '/security-history', label: 'Security History', icon: History },
        { path: '/knowledge', label: 'Knowledge Base', icon: FileText },
      ],
    },
    {
      title: 'Operations & System',
      items: [
        { path: '/reports', label: 'Reports', icon: FileText },
        { path: '/monitoring', label: 'Continuous Monitoring', icon: Radio },
        { path: '/audit', label: 'Audit Log', icon: FileText },
        { path: '/system/tools', label: 'Security Tools', icon: Terminal },
        { path: '/system', label: 'System Overview', icon: Server },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #bae6fd',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 10px',
        height: 'calc(100vh - 56px)',
        overflowY: 'auto',
        position: 'sticky',
        top: '56px',
        flexShrink: 0,
      }}
    >
      {sections.map((section, idx) => (
        <div key={section.title} style={{ marginBottom: idx === sections.length - 1 ? '16px' : '20px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#0284c7',
              marginBottom: '6px',
              paddingLeft: '10px',
            }}
          >
            {section.title}
          </div>
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0284c7' : '#475569',
                  backgroundColor: isActive ? '#e0f2fe' : 'transparent',
                  borderLeft: isActive ? '3px solid #0284c7' : '3px solid transparent',
                  marginBottom: '2px',
                  transition: 'all 0.12s ease',
                  textDecoration: 'none',
                })}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
    </aside>
  );
};
