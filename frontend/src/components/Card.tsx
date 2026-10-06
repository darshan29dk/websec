import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, style }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: subtitle ? '4px' : '16px',
          }}
        >
          {title && <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
};
