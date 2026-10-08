import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationDto } from '../types/notification';
import { Bell, CheckCheck, ExternalLink, ShieldAlert, AlertTriangle, Info, Clock } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: NotificationDto[];
  unreadCount: number;
  isLoading: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  isLoading,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = (item: NotificationDto) => {
    if (!item.read) {
      onMarkAsRead(item.id);
    }
    onClose();

    // Deep link navigation
    if (item.resourceType === 'FINDING' && item.resourceId) {
      navigate(`/findings/${item.resourceId}`);
    } else if (item.resourceType === 'INCIDENT' && item.resourceId) {
      navigate(`/incidents/${item.resourceId}`);
    } else if (item.resourceType === 'FORENSIC_CASE' && item.resourceId) {
      navigate(`/forensics/${item.resourceId}`);
    } else if (item.resourceType === 'ASSESSMENT' && item.resourceId) {
      navigate(`/assessments/${item.resourceId}`);
    } else if (item.resourceType === 'TARGET' && item.resourceId) {
      navigate(`/targets/${item.resourceId}`);
    } else if (item.type === 'CRITICAL_FINDING' || item.type === 'HIGH_FINDING' || item.type === 'NEW_FINDING') {
      navigate(item.resourceId ? `/findings/${item.resourceId}` : '/findings');
    } else if (item.type === 'REGRESSION') {
      navigate('/regression');
    } else if (item.type === 'DEFENSE_VALIDATION_FAILURE') {
      navigate('/defense');
    } else if (item.type === 'MONITORING_FAILURE') {
      navigate('/monitoring');
    } else if (item.type === 'AUTHORIZATION_EXPIRING' || item.type === 'AUTHORIZATION_EXPIRED') {
      navigate(item.resourceId ? `/targets/${item.resourceId}` : '/targets');
    } else if (item.type === 'POSTURE_DECREASE') {
      navigate('/posture');
    } else {
      navigate('/findings');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: '#fee2e2', color: '#dc2626', icon: <ShieldAlert size={14} color="#dc2626" /> };
      case 'HIGH':
        return { bg: '#ffedd5', color: '#ea580c', icon: <AlertTriangle size={14} color="#ea580c" /> };
      case 'MEDIUM':
        return { bg: '#fef3c7', color: '#d97706', icon: <AlertTriangle size={14} color="#d97706" /> };
      case 'LOW':
        return { bg: '#e0f2fe', color: '#0284c7', icon: <Info size={14} color="#0284c7" /> };
      default:
        return { bg: '#f1f5f9', color: '#475569', icon: <Info size={14} color="#475569" /> };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: '44px',
        width: '380px',
        maxHeight: '480px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        boxShadow: '0 12px 30px rgba(2, 132, 199, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 250,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
            Security Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                padding: '2px 7px',
                borderRadius: '10px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 6px',
              borderRadius: '4px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Loading alerts...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#f0f9ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}
            >
              <Bell size={18} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '4px' }}>
              No notifications
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              All targets and security parameters are operating normally.
            </div>
          </div>
        ) : (
          <div>
            {notifications.map((item) => {
              const badge = getSeverityBadge(item.severity);
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: item.read ? '#ffffff' : '#f0f9ff',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = item.read ? '#f8fafc' : '#e0f2fe')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = item.read ? '#ffffff' : '#f0f9ff')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ marginTop: '2px' }}>{badge.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: item.read ? 600 : 700,
                            color: 'var(--text-heading)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {item.severity}
                          </span>
                          {!item.read && (
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent-primary)',
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-main)',
                          marginTop: '4px',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.message}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={10} /> {formatTime(item.createdAt)}
                        </span>
                        {item.resourceType && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: 'var(--accent-primary)',
                              fontWeight: 600,
                            }}
                          >
                            View {item.resourceType} <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
