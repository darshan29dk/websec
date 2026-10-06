import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  style,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-heading)' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          width: '100%',
          backgroundColor: 'var(--bg-input)',
          border: error ? '1px solid var(--status-danger-border)' : '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '8px 12px',
          color: 'var(--text-main)',
          fontSize: '13px',
          outline: 'none',
          transition: 'border-color 0.15s',
          ...style,
        }}
        onFocus={(e) => (e.target.style.borderColor = error ? 'var(--status-danger-text)' : 'var(--border-focus)')}
        onBlur={(e) => (e.target.style.borderColor = error ? 'var(--status-danger-border)' : 'var(--border-color)')}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--status-danger-text)' }}>{error}</span>}
      {helperText && !error && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{helperText}</span>}
    </div>
  );
};
