import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { Target } from '../types/target';
import { AssessmentProfile } from '../types/assessment';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { ArrowLeft, Play, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ApiError } from '../types/common';

export const CreateAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTargetId = searchParams.get('targetId') || '';

  const [targets, setTargets] = useState<Target[]>([]);
  const [profiles, setProfiles] = useState<AssessmentProfile[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState(defaultTargetId);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [authConfirmed, setAuthConfirmed] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [targetPage, profileList] = await Promise.all([
          targetApi.getTargets(0, 100, 'ACTIVE'),
          assessmentApi.getProfiles(),
        ]);
        setTargets(targetPage.content);
        setProfiles(profileList);

        if (profileList.length > 0) {
          setSelectedProfileId(profileList[0].id);
        }
        if (!selectedTargetId && targetPage.content.length > 0) {
          setSelectedTargetId(targetPage.content[0].id);
        }
      } catch (err) {
        setError('Failed to load active targets or profiles.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedTarget = targets.find((t) => t.id === selectedTargetId);
  const isTargetAuthorized = selectedTarget?.authorized ?? false;
  const isFormValid = selectedTarget && isTargetAuthorized && selectedProfileId && authConfirmed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError('Please complete all requirements including valid target authorization.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assessment = await assessmentApi.createAssessment({
        targetId: selectedTargetId,
        profileId: selectedProfileId,
        authorizationConfirmed: authConfirmed,
      });
      navigate(`/assessments/${assessment.id}`);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to queue assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/assessments')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          marginBottom: '16px',
        }}
      >
        <ArrowLeft size={16} /> Back to Assessments
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Web Security Assessment Setup</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Configure assessment definition for an authorized target
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      <Card>
        <form onSubmit={handleSubmit}>
          {/* Target Selection */}
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
              Select Authorized Target
            </label>
            {targets.length === 0 && !isLoading ? (
              <Alert
                type="warning"
                message="No active targets registered. Please register an active security target first."
              />
            ) : (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.primaryUrl}) {t.authorized ? '✓ Authorized' : '⚠️ Missing Authorization'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Authorization Check Status Banner */}
          {selectedTarget && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '6px',
                backgroundColor: isTargetAuthorized ? 'rgba(46, 160, 67, 0.1)' : 'rgba(248, 81, 73, 0.1)',
                border: `1px solid ${isTargetAuthorized ? 'var(--status-active-border)' : 'var(--status-danger-border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {isTargetAuthorized ? (
                <ShieldCheck color="var(--status-active-text)" size={20} />
              ) : (
                <ShieldAlert color="var(--status-danger-text)" size={20} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: isTargetAuthorized ? 'var(--status-active-text)' : 'var(--status-danger-text)' }}>
                  {isTargetAuthorized ? 'Target Authorization Verified' : 'Authorization Unavailable'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                  {isTargetAuthorized
                    ? `Valid authorization on file expiring ${selectedTarget.authorizationExpirationDate}`
                    : 'Target does not have a valid, active authorization record on file.'}
                </div>
              </div>
            </div>
          )}

          {/* Assessment Profile Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '10px' }}>
              Select Assessment Profile
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {profiles.map((p) => {
                const isSelected = p.id === selectedProfileId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-input)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {p.profileType}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {p.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explicit User Checkbox Confirmation */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              marginBottom: '24px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={authConfirmed}
                onChange={(e) => setAuthConfirmed(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-heading)', lineHeight: '1.4' }}>
                I explicitly confirm that I am authorized to perform security testing against this target and possess documented consent or ownership.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/assessments')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isFormValid}
              isLoading={isSubmitting}
              icon={<Play size={16} />}
            >
              Create Assessment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
