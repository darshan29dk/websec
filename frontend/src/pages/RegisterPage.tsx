import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, MailCheck, ArrowRight } from 'lucide-react';
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

    if (!displayName || !email || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.requestOtp(cleanEmail);
      setSuccessMsg(`A 6-digit verification OTP code has been dispatched via SMTP to ${cleanEmail}.`);
      setStep('OTP');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to dispatch verification OTP to your email.');
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
      await register({ email, password, displayName, role, otp: otp.trim() });
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
        backgroundColor: '#070c18',
        backgroundImage: 'radial-gradient(circle at top, #0d2137 0%, #070c18 70%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.6)',
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
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              marginBottom: '12px',
            }}
          >
            <Shield size={26} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            Register Account
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
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
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                Requested Platform Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{
                  width: '100%',
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#f8fafc',
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
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Enter the 6-digit code sent to <strong style={{ color: '#60a5fa' }}>{email}</strong>
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
              onClick={() => setStep('DETAILS')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                marginTop: '12px',
                cursor: 'pointer',
                width: '100%',
                textDecoration: 'underline',
              }}
            >
              ← Edit Account Details
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: '#3b82f6' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
