import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Shield size={24} color="var(--accent-primary)" />
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'var(--text-heading)',
          }}
        >
          AEGIS
        </span>
        <span
          style={{
            fontSize: '11px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '2px 8px',
            borderRadius: '4px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          Web Security Platform • Phase 1
        </span>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                border: '1px solid var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <UserIcon size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                {user.displayName}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {user.role} • {user.email}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign out"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--status-danger-border)';
              e.currentTarget.style.color = 'var(--status-danger-text)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
};
