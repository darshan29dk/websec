import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { assessmentApi } from '../services/api/assessmentApi';
import { Target, AuthorizationType, ScopeType } from '../types/target';
import { Assessment } from '../types/assessment';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Play,
  FileCheck,
  Globe,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { ApiError } from '../types/common';

export const TargetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [target, setTarget] = useState<Target | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  // Auth Form
  const [authType, setAuthType] = useState<AuthorizationType>('WRITTEN_PERMISSION');
  const [authStatement, setAuthStatement] = useState(
    'I confirm explicit written permission to conduct web security assessments against this target.'
  );
  const [authDate, setAuthDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Scope Form
  const [scopeType, setScopeType] = useState<ScopeType>('URL');
  const [scopeValue, setScopeValue] = useState('');
  const [isScopeSubmitting, setIsScopeSubmitting] = useState(false);

  const fetchTargetDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await targetApi.getTargetById(id);
      setTarget(data);

      const assessmentData = await assessmentApi.getAssessments(0, 10, id);
      setAssessments(assessmentData.content);
    } catch (err: any) {
      setError('Failed to load target details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargetDetails();
    if (searchParams.get('authorizationNotice') === 'true') {
      setIsAuthModalOpen(true);
    }
  }, [id]);

  const handleAddAuthorization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setAuthError(null);

    setIsAuthSubmitting(true);
    try {
      await targetApi.addAuthorization(id, {
        authorizationType: authType,
        authorizationStatement: authStatement,
        authorizationDate: authDate,
        expirationDate: expDate,
      });
      setIsAuthModalOpen(false);
      fetchTargetDetails();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setAuthError(apiErr.message || 'Failed to add authorization record.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleAddScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !scopeValue) return;

    setIsScopeSubmitting(true);
    try {
      await targetApi.addScope(id, {
        scopeType,
        scopeValue,
        included: true,
      });
      setIsScopeModalOpen(false);
      setScopeValue('');
      fetchTargetDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add scope entry.');
    } finally {
      setIsScopeSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading target details...</div>;
  }

  if (error || !target) {
    return (
      <div>
        <Alert type="error" message={error || 'Target not found'} />
        <Button variant="secondary" onClick={() => navigate('/targets')}>
          Back to Targets
        </Button>
      </div>
    );
  }

  const isAuthValid = target.authorized;

  return (
    <div>
      <button
        onClick={() => navigate('/targets')}
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
        <ArrowLeft size={16} /> Back to Targets
      </button>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{target.name}</h1>
            <StatusBadge status={target.status} />
          </div>
          <a
            href={target.primaryUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', marginTop: '4px', display: 'inline-block' }}
          >
            {target.primaryUrl}
          </a>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" icon={<FileCheck size={16} />} onClick={() => setIsAuthModalOpen(true)}>
            Add Authorization
          </Button>

          {isAuthValid && target.status === 'ACTIVE' ? (
            <Link to={`/assessments/new?targetId=${target.id}`}>
              <Button variant="primary" icon={<Play size={16} />}>
                Create Assessment
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              disabled
              icon={<Play size={16} />}
              title="Assessment unavailable: valid authorization is required."
            >
              Create Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Authorization Status Warning Banner if missing */}
      {!isAuthValid && (
        <Alert
          type="warning"
          title="Assessment Unavailable: Target Authorization Required"
          message={
            <div>
              Scanning or creating assessments requires explicit authorization records. Please record owner or written permission.
              <div style={{ marginTop: '8px' }}>
                <Button size="sm" variant="primary" onClick={() => setIsAuthModalOpen(true)}>
                  Add Authorization Record
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* Grid metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card title="Target Metadata">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target ID</span>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{target.id}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Type</span>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{target.targetType}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Created By</span>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>{target.createdByName}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registration Date</span>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>{new Date(target.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {target.description && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Description</span>
              <p style={{ fontSize: '13px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{target.description}</p>
            </div>
          )}
        </Card>

        <Card title="Authorization Posture">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAuthValid ? (
                <ShieldCheck color="var(--status-active-text)" size={20} />
              ) : (
                <ShieldAlert color="var(--status-danger-text)" size={20} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>
                  {isAuthValid ? 'Authorized Target' : 'Authorization Required'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isAuthValid
                    ? `Valid until ${target.authorizationExpirationDate}`
                    : 'No valid active authorization'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authorization History ({target.authorizations?.length || 0})</span>
              {target.authorizations && target.authorizations.length > 0 ? (
                target.authorizations.map((auth) => (
                  <div
                    key={auth.id}
                    style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{auth.authorizationType}</span>
                      <StatusBadge status={auth.active ? 'ACTIVE' : 'EXPIRED'} />
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                      {auth.authorizationDate} to {auth.expirationDate}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>No records logged.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Target Scope Section */}
      <Card
        title="Scope Definitions"
        subtitle="Included domains, URLs, IPs, and path boundaries"
        action={
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setIsScopeModalOpen(true)}>
            Add Scope
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          data={target.scopes || []}
          keyExtractor={(s) => s.id}
          emptyMessage="No explicit scopes added yet."
          columns={[
            { header: 'Scope Type', accessor: 'scopeType' },
            {
              header: 'Scope Value',
              render: (s) => <code style={{ fontSize: '12px' }}>{s.scopeValue}</code>,
            },
            {
              header: 'Inclusion',
              render: (s) => (s.included ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="DISABLED" />),
            },
            {
              header: 'Created At',
              render: (s) => new Date(s.createdAt).toLocaleDateString(),
            },
          ]}
        />
      </Card>

      {/* Assessment History Section */}
      <Card title="Assessment History" subtitle="Security assessments requested for this target">
        <Table
          data={assessments}
          keyExtractor={(a) => a.id}
          emptyMessage="No security assessments created for this target yet."
          columns={[
            {
              header: 'Assessment ID',
              render: (a) => (
                <Link to={`/assessments/${a.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {a.id.substring(0, 8)}...
                </Link>
              ),
            },
            { header: 'Profile', accessor: 'profileName' },
            {
              header: 'Status',
              render: (a) => <StatusBadge status={a.status} />,
            },
            { header: 'Requested By', accessor: 'requestedByName' },
            {
              header: 'Created Date',
              render: (a) => new Date(a.createdAt).toLocaleString(),
            },
          ]}
        />
      </Card>

      {/* Add Authorization Modal */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Record Target Authorization">
        {authError && <Alert type="error" message={authError} />}
        <form onSubmit={handleAddAuthorization}>
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500 }}>Authorization Type</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthorizationType)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            >
              <option value="WRITTEN_PERMISSION">Written Permission / Contract</option>
              <option value="OWNER">System Owner / Internal Domain</option>
              <option value="LAB">Security Research Lab Environment</option>
              <option value="OTHER">Other Authorization Document</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500 }}>Authorization Statement</label>
            <textarea
              rows={3}
              value={authStatement}
              onChange={(e) => setAuthStatement(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Authorization Date"
              type="date"
              value={authDate}
              onChange={(e) => setAuthDate(e.target.value)}
              required
            />
            <Input
              label="Expiration Date"
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAuthModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isAuthSubmitting}>
              Save Authorization
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Scope Modal */}
      <Modal isOpen={isScopeModalOpen} onClose={() => setIsScopeModalOpen(false)} title="Add Target Scope">
        <form onSubmit={handleAddScope}>
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500 }}>Scope Type</label>
            <select
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as ScopeType)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            >
              <option value="URL">URL</option>
              <option value="DOMAIN">Domain</option>
              <option value="IP">IP Address</option>
              <option value="PATH">Path Pattern</option>
            </select>
          </div>

          <Input
            label="Scope Value"
            placeholder="e.g. api.example.com or /api/v1/*"
            value={scopeValue}
            onChange={(e) => setScopeValue(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsScopeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isScopeSubmitting}>
              Add Scope
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
