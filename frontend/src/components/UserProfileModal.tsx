import React from 'react';
import { User } from '../types/user';
import { Shield, User as UserIcon, Mail, Calendar, Key, CheckCircle2, LogOut, X } from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
}) => {
  if (!isOpen) return null;

  const getInitials = (name: string) => {
    if (!name) return 'GS';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not recorded';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(2, 132, 199, 0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
              Operator Account Profile
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
              borderRadius: '6px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-heading)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Identity Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                border: '2px solid var(--border-focus)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--accent-primary)',
              }}
            >
              {getInitials(user.displayName)}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>
                {user.displayName || 'Security Operator'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '2px' }}>
                Verified Operator Name
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                  }}
                >
                  {user.role}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: user.enabled ? '#dcfce7' : '#fee2e2',
                    color: user.enabled ? '#15803d' : '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={12} /> {user.enabled ? 'Account Active' : 'Account Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.5px',
                marginBottom: '10px',
                textTransform: 'uppercase',
              }}
            >
              Operator Profile Attributes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered Operator Name</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                  {user.displayName || 'Security Operator'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contact Email</span>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)', marginTop: '2px' }}>
                  {user.email}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Application Role</span>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)', marginTop: '2px' }}>
                  {user.role}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</span>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#15803d', marginTop: '2px' }}>
                  {user.enabled ? 'Authorized & Active' : 'Suspended'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created Date</span>
                <div style={{ fontSize: '11px', color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatDate(user.createdAt)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last Login</span>
                <div style={{ fontSize: '11px', color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatDate(user.lastLoginAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Security & Session Section */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.5px',
                marginBottom: '10px',
                textTransform: 'uppercase',
              }}
            >
              Session &amp; Security Controls
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authentication State</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#0284c7',
                    backgroundColor: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  JWT Bearer Active
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Access Level</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                  {user.role === 'ADMIN' ? 'Superadmin Platform Privileges' : 'Security Analyst Standard Access'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secrets &amp; Tokens</span>
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                  Encrypted &amp; Masked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            style={{
              padding: '8px 14px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fecaca')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
          >
            <LogOut size={14} /> End Session &amp; Sign Out
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              color: 'var(--text-heading)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
