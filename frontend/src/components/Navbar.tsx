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
          backgroundColor: '#0b0f19',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
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
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} color="#3b82f6" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: '#f8fafc',
                  lineHeight: '1.2',
                }}
              >
                GLOBALSHIELD
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                  fontWeight: 500,
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
              backgroundColor: '#1e293b',
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
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
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
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#60a5fa',
            }}
          >
            <Activity size={12} color="#3b82f6" />
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
            backgroundColor: '#111827',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '6px 14px',
            width: '280px',
            color: '#64748b',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#334155')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
        >
          <Search size={14} color="#64748b" />
          <span style={{ flex: 1, textAlign: 'left' }}>Search targets, findings, incidents...</span>
          <kbd
            style={{
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              padding: '2px 5px',
              borderRadius: '4px',
              border: '1px solid #334155',
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
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '6px',
                  color: '#94a3b8',
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
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    padding: '12px',
                    zIndex: 200,
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#f8fafc',
                      marginBottom: '8px',
                      paddingBottom: '6px',
                      borderBottom: '1px solid #1e293b',
                    }}
                  >
                    Security Alerts &amp; Notifications
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', padding: '6px 0' }}>
                    <div style={{ fontWeight: 600, color: '#f97316' }}>Retest Pending</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>
                      Controlled retest requested for target scope
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', padding: '6px 0', borderTop: '1px solid #1e293b' }}>
                    <div style={{ fontWeight: 600, color: '#3b82f6' }}>Continuous Monitoring Active</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>All target schedules verified</div>
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
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                }}
              >
                <UserIcon size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', lineHeight: '1.2' }}>
                  {user.displayName}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
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
                border: '1px solid #1e293b',
                color: '#94a3b8',
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
                e.currentTarget.style.borderColor = '#ef444440';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.color = '#94a3b8';
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
