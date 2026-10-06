import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'target' | 'assessment' | 'authorization' | 'health';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = () => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'COMPLETED':
      case 'UP':
        return {
          bg: 'var(--status-active-bg)',
          border: 'var(--status-active-border)',
          color: 'var(--status-active-text)',
        };
      case 'QUEUED':
      case 'RUNNING':
        return {
          bg: 'var(--status-queued-bg)',
          border: 'var(--status-queued-border)',
          color: 'var(--status-queued-text)',
        };
      case 'DISABLED':
      case 'ARCHIVED':
      case 'CANCELLED':
      case 'DRAFT':
        return {
          bg: 'var(--status-disabled-bg)',
          border: 'var(--status-disabled-border)',
          color: 'var(--status-disabled-text)',
        };
      case 'FAILED':
      case 'EXPIRED':
      case 'DOWN':
        return {
          bg: 'var(--status-danger-bg)',
          border: 'var(--status-danger-border)',
          color: 'var(--status-danger-text)',
        };
      default:
        return {
          bg: 'var(--status-disabled-bg)',
          border: 'var(--status-disabled-border)',
          color: 'var(--status-disabled-text)',
        };
    }
  };

  const style = getStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: style.color,
          marginRight: '6px',
        }}
      />
      {status}
    </span>
  );
};
