import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { targetApi } from '../services/api/targetApi';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Shield, ArrowLeft } from 'lucide-react';
import { ApiError } from '../types/common';

export const AddTargetPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [primaryUrl, setPrimaryUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !primaryUrl) {
      setError('Target Name and Primary URL are required.');
      return;
    }

    setIsLoading(true);
    try {
      const createdTarget = await targetApi.createTarget({
        name,
        primaryUrl,
        description,
      });
      // Navigate to target detail page to add authorization
      navigate(`/targets/${createdTarget.id}?authorizationNotice=true`);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to register target URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
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

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Register Security Target</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Add a web application URL for authorized security assessment
        </p>
      </div>

      <Alert
        type="info"
        title="Authorized Assessment Policy"
        message="Registering a web URL creates a target record. Scanning or assessment will require explicit authorization recording before execution."
      />

      {error && <Alert type="error" message={error} />}

      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Target Name"
            placeholder="e.g. Primary Customer Portal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="Human-readable identifier for this target web application"
            required
          />

          <Input
            label="Primary Web Target URL"
            type="text"
            placeholder="https://example.com"
            value={primaryUrl}
            onChange={(e) => setPrimaryUrl(e.target.value)}
            helperText="Must be a valid HTTP or HTTPS Web URL. Schemes such as file://, javascript:, ftp:// are rejected."
            required
          />

          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-heading)' }}>
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="System background, environment notes, or scope boundaries..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/targets')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} icon={<Shield size={16} />}>
              Create Target
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
