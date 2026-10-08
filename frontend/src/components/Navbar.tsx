import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon, Search, Bell, Activity, CheckCircle2 } from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDropdown } from './NotificationDropdown';
import { UserProfileModal } from './UserProfileModal';
import { notificationApi } from '../services/api/notificationApi';
import { NotificationDto } from '../types/notification';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setIsLoadingNotifications(true);
      const res = await notificationApi.getNotifications(0, 15);
      if (res && res.content) {
        setNotifications(res.content);
      } else if (Array.isArray(res)) {
        setNotifications(res);
      }
    } catch {
      // Keep existing state if fetch fails temporarily
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'GS';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
        {/* Brand & Environment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            onClick={() => navigate('/overview')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
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
          <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-main)' }}>
            Search targets, findings, incidents...
          </span>
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
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                title="Security Notifications"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: 'var(--accent-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative',
                  backgroundColor: showNotifications ? 'var(--accent-light)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '1px 5px',
                      lineHeight: '1.2',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  isLoading={isLoadingNotifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                />
              )}
            </div>

            {/* User Profile Area (Clickable to open profile modal) */}
            <div
              id="navbar-user-profile-trigger"
              onClick={() => setShowProfileModal(true)}
              title="Click to view operator profile and account details"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(2, 132, 199, 0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                e.currentTarget.style.borderColor = 'var(--border-focus)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-light)',
                  border: '1.5px solid var(--border-focus)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                {getInitials(user.displayName)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-heading)',
                      lineHeight: '1.2',
                    }}
                  >
                    {user.displayName || 'Security Operator'}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    Active
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      backgroundColor: 'var(--accent-light)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {user.role || 'SECURITY ANALYST'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    • Profile
                  </span>
                </div>
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

      {/* User Profile Modal */}
      {user && (
        <UserProfileModal
          user={user}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={() => {
            setShowProfileModal(false);
            logout();
          }}
        />
      )}
    </>
  );
};
