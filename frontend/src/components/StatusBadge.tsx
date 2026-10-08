import React from 'react';

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  type?: 'target' | 'assessment' | 'authorization' | 'health' | 'severity' | 'control';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel }) => {
  const getStyle = () => {
    const s = status?.toUpperCase() || '';

    // Severities
    if (s === 'CRITICAL') {
      return { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' };
    }
    if (s === 'HIGH') {
      return { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.4)', color: '#f97316' };
    }
    if (s === 'MEDIUM') {
      return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' };
    }
    if (s === 'LOW') {
      return { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.4)', color: '#3b82f6' };
    }
    if (s === 'INFO' || s === 'INFORMATIONAL') {
      return { bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.4)', color: '#94a3b8' };
    }

    // Statuses
    switch (s) {
      case 'ACTIVE':
      case 'COMPLETED':
      case 'UP':
      case 'HEALTHY':
      case 'AVAILABLE':
      case 'VALIDATED':
      case 'CLOSED':
      case 'FIXED':
        return {
          bg: 'var(--status-active-bg)',
          border: 'var(--status-active-border)',
          color: 'var(--status-active-text)',
        };
      case 'QUEUED':
      case 'RUNNING':
      case 'IN_PROGRESS':
      case 'RETEST_REQUIRED':
      case 'REMEDIATION_SUBMITTED':
        return {
          bg: 'var(--status-queued-bg)',
          border: 'var(--status-queued-border)',
          color: 'var(--status-queued-text)',
        };
      case 'WARNING':
      case 'PARTIALLY_FIXED':
      case 'STILL_PRESENT':
        return {
          bg: 'var(--status-warning-bg)',
          border: 'var(--status-warning-border)',
          color: 'var(--status-warning-text)',
        };
      case 'DISABLED':
      case 'ARCHIVED':
      case 'CANCELLED':
      case 'DRAFT':
      case 'NOT_CONFIGURED':
        return {
          bg: 'var(--status-disabled-bg)',
          border: 'var(--status-disabled-border)',
          color: 'var(--status-disabled-text)',
        };
      case 'FAILED':
      case 'EXPIRED':
      case 'DOWN':
      case 'AT_RISK':
      case 'REGRESSED':
      case 'BLOCKED_AUTHORIZATION_EXPIRED':
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
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: style.color,
          marginRight: '6px',
        }}
      />
      {customLabel || status}
    </span>
  );
};
