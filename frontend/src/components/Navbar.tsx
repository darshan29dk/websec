import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon, Search, Bell, Activity } from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header
        style={{
          height: '56px',
          backgroundColor: 'var(--bg-navbar)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
        }}
      >
        {/* Brand & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-light)',
                border: '1px solid var(--border-focus)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} color="var(--accent-primary)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--text-heading)',
                  lineHeight: '1.2',
                }}
              >
                GLOBALSHIELD
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  letterSpacing: '0.2px',
                }}
              >
                Intelligent Web Security &amp; Defense
              </span>
            </div>
          </div>

          <div
            style={{
              height: '16px',
              width: '1px',
              backgroundColor: 'var(--border-color)',
              margin: '0 4px',
            }}
          />

          {/* Environment Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '12px',
              backgroundColor: 'var(--status-active-bg)',
              border: '1px solid var(--status-active-border)',
              color: 'var(--status-active-text)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-active-text)',
              }}
            />
            <span>Production</span>
          </div>

          {/* Security Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '12px',
              backgroundColor: 'var(--status-queued-bg)',
              border: '1px solid var(--status-queued-border)',
              color: 'var(--status-queued-text)',
            }}
          >
            <Activity size={12} color="var(--status-queued-text)" />
            <span>Protection Active</span>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <button
          onClick={() => setIsSearchOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px 14px',
            width: '280px',
            color: 'var(--text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <Search size={14} color="var(--accent-primary)" />
          <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-main)' }}>Search targets, findings, incidents...</span>
          <kbd
            style={{
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-primary)',
              padding: '2px 5px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
            }}
          >
            Ctrl K
          </kbd>
        </button>

        {/* Right User & Notification Controls */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px',
                  color: 'var(--accent-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Bell size={16} />
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                  }}
                />
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '40px',
                    width: '300px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -3px rgba(2, 132, 199, 0.15)',
                    padding: '12px',
                    zIndex: 200,
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-heading)',
                      marginBottom: '8px',
                      paddingBottom: '6px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    Security Alerts &amp; Notifications
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', padding: '6px 0' }}>
                    <div style={{ fontWeight: 600, color: '#ea580c' }}>Retest Pending</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      Controlled retest requested for target scope
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', padding: '6px 0', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, color: '#0284c7' }}>Continuous Monitoring Active</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>All target schedules verified</div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-light)',
                  border: '1px solid var(--border-focus)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                }}
              >
                <UserIcon size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)', lineHeight: '1.2' }}>
                  {user.displayName}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {user.role || 'SECURITY_ANALYST'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Sign out"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#fca5a5';
                e.currentTarget.style.color = '#dc2626';
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

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
