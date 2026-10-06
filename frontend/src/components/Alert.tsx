import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, message }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'var(--status-danger-bg)',
          border: 'var(--status-danger-border)',
          color: 'var(--status-danger-text)',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          bg: 'var(--status-warning-bg)',
          border: 'var(--status-warning-border)',
          color: 'var(--status-warning-text)',
          Icon: AlertTriangle,
        };
      case 'success':
        return {
          bg: 'var(--status-active-bg)',
          border: 'var(--status-active-border)',
          color: 'var(--status-active-text)',
          Icon: CheckCircle2,
        };
      case 'info':
      default:
        return {
          bg: 'var(--status-queued-bg)',
          border: 'var(--status-queued-border)',
          color: 'var(--status-queued-text)',
          Icon: Info,
        };
    }
  };

  const { bg, border, color, Icon } = getAlertStyles();

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '6px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: color,
        fontSize: '13px',
        marginBottom: '16px',
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '2px' }}>{title}</div>}
        <div style={{ color: 'var(--text-main)' }}>{message}</div>
      </div>
    </div>
  );
};
