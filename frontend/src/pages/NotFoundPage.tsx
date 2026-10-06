import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        textAlign: 'center',
      }}
    >
      <ShieldAlert size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px' }}>
        The requested resource path does not exist on the AEGIS platform.
      </p>
      <Link to="/overview">
        <Button variant="primary">Return to Security Overview</Button>
      </Link>
    </div>
  );
};
