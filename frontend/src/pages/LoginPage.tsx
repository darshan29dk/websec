import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { ApiError } from '../types/common';
import { authApi } from '../services/api/authApi';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'LOGIN' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'>('LOGIN');

  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Password Reset Form
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@outlook.com') && !cleanEmail.endsWith('@aegis.local')) {
      setError('Access restricted: Only @gmail.com and @outlook.com email addresses are authorized to log in.');
      return;
    }

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/overview');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = resetEmail.toLowerCase().trim();
    if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@outlook.com') && !cleanEmail.endsWith('@aegis.local')) {
      setError('Access restricted: Only @gmail.com and @outlook.com email addresses are authorized.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(cleanEmail);
      setSuccessMsg(`A 6-digit password reset OTP has been dispatched via SMTP to ${cleanEmail}.`);
      setMode('RESET_PASSWORD');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to send password reset OTP. Verify email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp || !newPassword) {
      setError('Please provide the 6-digit OTP code and your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: resetEmail.toLowerCase().trim(),
        otp: otp.trim(),
        newPassword
      });
      setSuccessMsg('Password reset successfully (SHA-512 encrypted). Please log in with your new password.');
      setEmail(resetEmail);
      setPassword('');
      setMode('LOGIN');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Password reset failed. Invalid or expired OTP code.');
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
        backgroundColor: '#090d16',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '420px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
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
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
              marginBottom: '12px',
            }}
          >
            <Shield size={26} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
            GLOBALSHIELD
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Intelligent Web Security &amp; Defense Platform
          </p>
        </div>

        {error && <Alert type="error" message={error} />}
        {successMsg && <Alert type="info" message={successMsg} />}

        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit}>
            <Input
              label="Authorized Email Address (@gmail.com / @outlook.com)"
              type="email"
              placeholder="darshanreddy5822@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', marginTop: '-8px' }}>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setResetEmail(email || 'darshanreddy5822@gmail.com');
                  setMode('FORGOT_PASSWORD');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', marginTop: '4px' }}>
              Sign In
            </Button>
          </form>
        )}

        {mode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleSendResetOtp}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                Reset Password via Email OTP
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Enter your registered email address to receive a 6-digit OTP code from SMTP sender (darshanreddy5822@gmail.com).
              </p>
            </div>

            <Input
              label="Registered Email Address"
              type="email"
              placeholder="darshanreddy5822@gmail.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              autoFocus
            />

            <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', marginTop: '8px' }}>
              <Mail size={16} style={{ marginRight: '6px' }} />
              Send Password Reset OTP
            </Button>

            <button
              type="button"
              onClick={() => { setError(null); setMode('LOGIN'); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                marginTop: '14px',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>
        )}

        {mode === 'RESET_PASSWORD' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                Enter Reset OTP &amp; New Password
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                A 6-digit OTP code was sent to <strong style={{ color: '#60a5fa' }}>{resetEmail}</strong>.
              </p>
            </div>

            <Input
              label="6-Digit Reset OTP Code"
              type="text"
              placeholder="810394"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="New Password (SHA-512 Encrypted)"
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', marginTop: '8px' }}>
              <KeyRound size={16} style={{ marginRight: '6px' }} />
              Reset Password &amp; Update
            </Button>

            <button
              type="button"
              onClick={() => { setError(null); setMode('FORGOT_PASSWORD'); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                marginTop: '14px',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeft size={14} /> Resend OTP / Change Email
            </button>
          </form>
        )}

        {mode === 'LOGIN' && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: '#3b82f6' }}>
              Register Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
