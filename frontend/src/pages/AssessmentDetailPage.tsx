import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../services/api/assessmentApi';
import { Assessment } from '../types/assessment';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { ArrowLeft, ShieldCheck, Clock, Ban } from 'lucide-react';

export const AssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await assessmentApi.getAssessmentById(id);
      setAssessment(data);
    } catch (err: any) {
      setError('Failed to load assessment record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    if (window.confirm('Cancel this queued assessment?')) {
      try {
        await assessmentApi.cancelAssessment(id);
        fetchAssessment();
      } catch (err: any) {
        alert(err.message || 'Failed to cancel assessment.');
      }
    }
  };

  if (isLoading) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading assessment details...</div>;
  }

  if (error || !assessment) {
    return (
      <div>
        <Alert type="error" message={error || 'Assessment not found'} />
        <Button variant="secondary" onClick={() => navigate('/assessments')}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Assessment Record</h1>
            <StatusBadge status={assessment.status} />
          </div>
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}>
            ID: {assessment.id}
          </p>
        </div>

        {assessment.status === 'QUEUED' && (
          <Button variant="danger" icon={<Ban size={16} />} onClick={handleCancel}>
            Cancel Assessment
          </Button>
        )}
      </div>

      {/* Assessment Lifecycle & Progress */}
      {assessment.status === 'RUNNING' && (
        <Card title="Assessment Execution Progress" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                Stage: {assessment.currentStage || 'RUNNING'}
              </span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                {assessment.progressPercent || 0}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${assessment.progressPercent || 0}%`,
                height: '100%',
                backgroundColor: 'var(--accent-primary)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </Card>
      )}

      {/* Phase 3 Assessment Quick Links */}
      {(assessment.status === 'COMPLETED' || assessment.status === 'RUNNING') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
              Discovered Attack Surface
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Explore correlated assets, host inventory, open ports, endpoints, and technologies.
            </p>
            <Button variant="primary" onClick={() => navigate(`/attack-surface?assessmentId=${assessment.id}`)}>
              View Attack Surface
            </Button>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
              Vulnerability Intelligence
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Inspect normalized, deduplicated security findings and evidence provenance.
            </p>
            <Button variant="primary" onClick={() => navigate(`/findings?assessmentId=${assessment.id}`)}>
              View Security Findings
            </Button>
          </div>
        </div>
      )}

      <Card title="Assessment Details" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Name</span>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              <Link to={`/targets/${assessment.targetId}`} style={{ color: 'var(--text-heading)' }}>
                {assessment.targetName}
              </Link>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Primary URL</span>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {assessment.targetPrimaryUrl}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Profile Name</span>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              {assessment.profileName} ({assessment.profileType})
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Requested By</span>
            <div style={{ fontSize: '13px', marginTop: '2px' }}>{assessment.requestedByName}</div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authorization Confirmation</span>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px', color: 'var(--status-active-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={16} /> Explicitly Confirmed
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Creation Timestamp</span>
            <div style={{ fontSize: '13px', marginTop: '2px' }}>{new Date(assessment.createdAt).toLocaleString()}</div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Execution Start Time</span>
            <div style={{ fontSize: '13px', marginTop: '2px', color: 'var(--text-muted)' }}>
              {assessment.startedAt ? new Date(assessment.startedAt).toLocaleString() : 'Not started yet'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Execution Completion Time</span>
            <div style={{ fontSize: '13px', marginTop: '2px', color: 'var(--text-muted)' }}>
              {assessment.completedAt ? new Date(assessment.completedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
