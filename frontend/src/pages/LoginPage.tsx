import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  KeyRound,
  Mail,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Cpu,
  Terminal,
  Activity,
  RotateCcw,
  CheckCircle2,
  Database,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { ApiError } from '../types/common';
import { authApi } from '../services/api/authApi';
import cyberBg from '../assets/cyber-defense-bg.jpg';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'LOGIN' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'>('LOGIN');

  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    if (!cleanEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: cleanEmail, password });
      navigate('/overview');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = resetEmail.toLowerCase().trim();
    if (!cleanEmail) {
      setError('Please provide a valid registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(cleanEmail);
      setSuccessMsg(`A 6-digit password reset OTP has been dispatched to ${cleanEmail}.`);
      setMode('RESET_PASSWORD');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to dispatch password reset OTP. Verify email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp || !newPassword) {
      setError('Please enter both the 6-digit OTP code and your new password.');
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
      setSuccessMsg('Password reset successfully. Please sign in with your new credentials.');
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
        width: '100vw',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#030712',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ============================================================== */}
      {/* LEFT 65% SHOWCASE: Hero Background, Logo, Name & Platform Points */}
      {/* ============================================================== */}
      <div
        style={{
          flex: '0 0 65%',
          width: '65%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          backgroundImage: `linear-gradient(135deg, rgba(3, 7, 18, 0.94) 0%, rgba(8, 20, 44, 0.82) 40%, rgba(2, 6, 23, 0.95) 100%), url(${cyberBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          overflowY: 'auto',
          borderRight: '1px solid rgba(56, 189, 248, 0.15)',
        }}
      >
        {/* Subtle Cyber Grid Accents */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none',
            opacity: 0.6,
          }}
        />

        {/* Top Branding Section */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '8px' }}>
            {/* Glowing Logo Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #10b981 100%)',
                padding: '2px',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '14px',
                  backgroundColor: '#050b1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={32} color="#38bdf8" />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    margin: 0,
                    color: '#ffffff',
                    background: 'linear-gradient(90deg, #ffffff 0%, #bae6fd 60%, #38bdf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 24px rgba(56, 189, 248, 0.25)',
                  }}
                >
                  GLOBALSHIELD
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '20px',
                  }}
                >
                  ENTERPRISE v1.0
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
                Autonomous Web Security &amp; Cyber Threat Defense Matrix
              </p>
            </div>
          </div>
        </div>

        {/* Center Main Presentation: Hero & 4 Key Capability Points */}
        <div style={{ position: 'relative', zIndex: 2, margin: '32px 0' }}>
          <div style={{ maxWidth: '820px', marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#f8fafc',
                lineHeight: 1.35,
                marginBottom: '10px',
              }}
            >
              Autonomous Security Testing, Web Application Fuzzing &amp; Closed-Loop Defense
            </h2>
            <p
              style={{
                fontSize: '14.5px',
                color: '#94a3b8',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              GlobalShield unifies continuous attack surface reconnaissance, automated stateful API fuzzing,
              and multi-agent SOC defense to discover, validate, and remediate vulnerabilities before exploitation.
            </p>
          </div>

          {/* Key Feature Points Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              maxWidth: '900px',
            }}
          >
            {/* Point 1: Autonomous Fuzzing */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '12px',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <Terminal size={17} />
                </div>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                  Autonomous Web &amp; API Fuzzing
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                Intelligent heuristic payload mutation, state-aware parameter discovery, and verified vulnerability confirmation.
              </p>
            </div>

            {/* Point 2: 25-Tool Security Ecosystem */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '12px',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <Cpu size={17} />
                </div>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                  25-Tool Security Ecosystem
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                Unified orchestration across OWASP ZAP, Nuclei, Nmap, Nikto, Burp Suite, SQLMap, Gobuster, and 18+ integrations.
              </p>
            </div>

            {/* Point 3: SOC Threat Detection & Forensics */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '12px',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#eab308',
                  }}
                >
                  <Activity size={17} />
                </div>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                  Threat Detection &amp; SOC Forensics
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                High-frequency target health monitoring, Suricata/Zeek network telemetry, and forensic timeline reconstruction.
              </p>
            </div>

            {/* Point 4: Remediation & Retesting */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '12px',
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a78bfa',
                  }}
                >
                  <RotateCcw size={17} />
                </div>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                  Closed-Loop Retesting &amp; Remediation
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                Three-mode remediation engine (Advisory, Guided, Automated) with regression tracking and posture validation.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Platform Badges */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '20px',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={14} color="#10b981" />
            <span>Supabase Cloud PostgreSQL Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={14} color="#38bdf8" />
            <span>OWASP Top 10 &amp; CWE Compliant</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} color="#a78bfa" />
            <span>Zero-Trust Scope Enforcement</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT 35% PANEL: High-Tech Secure Login Card                     */}
      {/* ============================================================== */}
      <div
        style={{
          flex: '0 0 35%',
          width: '35%',
          minWidth: '380px',
          backgroundColor: '#080e1b',
          borderLeft: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 36px',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10,
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Card Header with Logo & Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                marginBottom: '14px',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
              }}
            >
              <Shield size={30} />
            </div>

            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '1px',
                margin: '0 0 6px 0',
              }}
            >
              GLOBALSHIELD
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Authorized Access Control Gateway
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '16px' }}>
              <Alert type="error" message={error} />
            </div>
          )}
          {successMsg && (
            <div style={{ marginBottom: '16px' }}>
              <Alert type="info" message={successMsg} />
            </div>
          )}

          {/* ---------------- MODE: LOGIN ---------------- */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit}>
              {/* Email Field */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: '6px',
                    letterSpacing: '0.3px',
                  }}
                >
                  Authorized Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '11px 14px 11px 38px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                    onBlur={(e) => (e.target.style.borderColor = '#334155')}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: '6px',
                    letterSpacing: '0.3px',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '11px 38px 11px 38px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                    onBlur={(e) => (e.target.style.borderColor = '#334155')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '22px',
                  marginTop: '-4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setResetEmail(email || '');
                    setMode('FORGOT_PASSWORD');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.3px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                Sign In to Console
              </Button>
            </form>
          )}

          {/* ---------------- MODE: FORGOT_PASSWORD ---------------- */}
          {mode === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleSendResetOtp}>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  Reset Password via OTP
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  Enter your email address to receive a 6-digit verification code.
                </p>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Registered Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '11px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
              >
                <Mail size={16} style={{ marginRight: '8px' }} />
                Send Reset Code
              </Button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('LOGIN');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  marginTop: '16px',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </form>
          )}

          {/* ---------------- MODE: RESET_PASSWORD ---------------- */}
          {mode === 'RESET_PASSWORD' && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  Enter Reset OTP &amp; New Password
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  A 6-digit OTP code was sent to <strong style={{ color: '#38bdf8' }}>{resetEmail}</strong>.
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '11px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  New Password (Min. 8 characters)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '11px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
              >
                <KeyRound size={16} style={{ marginRight: '8px' }} />
                Reset &amp; Sign In
              </Button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('FORGOT_PASSWORD');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  marginTop: '16px',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} /> Resend OTP / Change Email
              </button>
            </form>
          )}

          {/* Card Footer: Register Link */}
          {mode === 'LOGIN' && (
            <div
              style={{
                marginTop: '28px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#64748b',
                paddingTop: '18px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              Need operator access?{' '}
              <Link to="/register" style={{ fontWeight: 600, color: '#38bdf8' }}>
                Register Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
