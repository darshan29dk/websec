import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, MailCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { UserRole } from '../types/user';
import { ApiError } from '../types/common';
import { authApi } from '../services/api/authApi';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ANALYST');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@outlook.com') && !cleanEmail.endsWith('@aegis.local')) {
      setError('Registration restricted: Only @gmail.com and @outlook.com email addresses are authorized.');
      return;
    }

    if (!displayName.trim() || !email.trim() || !password) {
      setError('Please fill out all required fields, including your Full Operator Name.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.requestOtp(cleanEmail);
      setSuccessMsg(`A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox (and spam folder).`);
      setOtp('');
      setStep('OTP');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.trim().length === 0) {
      setError('Please enter the 6-digit verification OTP code sent to your email.');
      return;
    }

    setIsLoading(true);
    try {
      await register({ email, password, displayName: displayName.trim(), role, otp: otp.trim() });
      navigate('/overview');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Registration failed. Verification code may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f7ff',
        backgroundImage: 'radial-gradient(circle at top, #e0f2fe 0%, #f0f7ff 70%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '440px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-light)',
              border: '1px solid var(--border-focus)',
              color: 'var(--accent-primary)',
              marginBottom: '12px',
            }}
          >
            <Shield size={26} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)' }}>
            Register Account
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            GLOBALSHIELD Security Console Access Registration
          </p>
        </div>

        {error && <Alert type="error" message={error} />}
        {successMsg && <Alert type="info" message={successMsg} />}

        {step === 'DETAILS' ? (
          <form onSubmit={handleRequestOtp}>
            <Input
              label="Full Display Name"
              type="text"
              placeholder="Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Input
              label="Authorized Email Address (@gmail.com / @outlook.com)"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password (SHA-512 Encrypted)"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                Requested Platform Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="ANALYST">Security Analyst</option>
                <option value="ADMIN">System Administrator</option>
                <option value="VIEWER">Read-only Viewer</option>
              </select>
            </div>

            <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', marginTop: '8px' }}>
              <MailCheck size={16} style={{ marginRight: '6px' }} />
              Send Email Verification OTP
            </Button>

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <ArrowLeft size={13} />
                <span>Backtrack to Sign In</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            {/* Operator Identity Banner */}
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                backgroundColor: 'var(--accent-light)',
                borderRadius: '8px',
                border: '1px solid var(--border-focus)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Registering Operator
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-heading)',
                  marginTop: '2px',
                }}
              >
                {displayName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Verifying email: <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                Enter the 6-digit OTP code sent to your email to verify and activate your account.
              </span>
            </div>

            <Input
              label="6-Digit OTP Verification Code"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoFocus
            />

            <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', marginTop: '8px' }}>
              <KeyRound size={16} style={{ marginRight: '6px' }} />
              Verify OTP &amp; Create Account
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep('DETAILS');
                setError(null);
                setSuccessMsg(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-heading)',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '12px',
                padding: '8px 14px',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 1px 2px rgba(2, 132, 199, 0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-heading)';
              }}
            >
              <ArrowLeft size={14} color="var(--accent-primary)" />
              <span>Backtrack to Account Details</span>
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: '#0284c7' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
