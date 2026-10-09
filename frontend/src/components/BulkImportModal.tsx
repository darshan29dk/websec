import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Alert } from './Alert';
import { Table } from './Table';
import { targetApi } from '../services/api/targetApi';
import { BulkImportResponse } from '../types/dashboard';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, ArrowRight, RefreshCw, Copy, Check } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  name: string;
  primaryUrl: string;
  description: string;
  status: 'VALID' | 'INVALID' | 'DUPLICATE';
  message: string;
}

const CSV_SAMPLE = `name,primaryUrl,description
Global Payment Portal,https://pay.example.com,Customer payment and checkout gateway
Customer Auth Service,https://auth.example.com,Identity and SSO provider
Partner API Endpoint,https://api.example.com/v1,B2B external integration API`;

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'INPUT' | 'PREVIEW' | 'RESULT'>('INPUT');
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [copiedSample, setCopiedSample] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResponse | null>(null);

  const resetState = () => {
    setStep('INPUT');
    setCsvText('');
    setFileName(null);
    setParsedRows([]);
    setError(null);
    setResult(null);
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a valid .csv file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must not exceed 2 MB.');
      return;
    }

    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text || '');
    };
    reader.readAsText(file);
  };

  const parseAndPreview = () => {
    if (!csvText.trim()) {
      setError('Please provide CSV data or select a file to import.');
      return;
    }

    try {
      const lines = csvText.split('\n');
      const rows: ParsedRow[] = [];
      const seenUrls = new Set<string>();
      let isHeader = true;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        const parts = line.split(',').map((p) => p.trim());
        if (isHeader) {
          isHeader = false;
          if (parts[0].toLowerCase() === 'name' || parts[0].toLowerCase() === 'website') {
            continue;
          }
        }

        const name = parts[0] || '';
        const url = parts[1] || '';
        const desc = parts.slice(2).join(',') || '';

        let status: 'VALID' | 'INVALID' | 'DUPLICATE' = 'VALID';
        let message = 'Ready to import';

        if (name.length < 2) {
          status = 'INVALID';
          message = 'Website name must be at least 2 characters';
        } else if (!url) {
          status = 'INVALID';
          message = 'Primary URL is required';
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
          status = 'INVALID';
          message = 'URL must start with http:// or https://';
        } else if (seenUrls.has(url.toLowerCase())) {
          status = 'DUPLICATE';
          message = 'Duplicate URL in import batch';
        }

        if (status === 'VALID') {
          seenUrls.add(url.toLowerCase());
        }

        rows.push({
          name,
          primaryUrl: url,
          description: desc,
          status,
          message,
        });
      }

      if (rows.length === 0) {
        setError('No valid website rows detected. Please check CSV formatting.');
        return;
      }

      setParsedRows(rows);
      setError(null);
      setStep('PREVIEW');
    } catch (err: any) {
      setError('Failed to parse CSV: ' + err.message);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.status === 'VALID');
    if (validRows.length === 0) {
      setError('No valid rows available to import.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        entries: validRows.map((r) => ({
          name: r.name,
          primaryUrl: r.primaryUrl,
          description: r.description,
        })),
      };

      const res = await targetApi.bulkImport(payload);
      setResult(res);
      setStep('RESULT');
    } catch (err: any) {
      setError(err.message || 'Failed to execute bulk import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(CSV_SAMPLE);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const validCount = parsedRows.filter((r) => r.status === 'VALID').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'INVALID').length;
  const dupCount = parsedRows.filter((r) => r.status === 'DUPLICATE').length;

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="Bulk Import Website Targets">
      <div style={{ minWidth: '650px', maxWidth: '800px' }}>
        {error && (
          <div style={{ marginBottom: '16px' }}>
            <Alert type="error" message={error} />
          </div>
        )}

        {step === 'INPUT' && (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Import multiple web applications and APIs into GlobalShield. Each website target will be verified
              and tracked independently. Scanning is <strong>never</strong> triggered automatically.
            </p>

            {/* Template sample box */}
            <div
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  CSV Template (name, primaryUrl, description)
                </span>
                <button
                  type="button"
                  onClick={handleCopySample}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedSample ? <Check size={12} /> : <Copy size={12} />}
                  {copiedSample ? 'Copied' : 'Copy Template'}
                </button>
              </div>
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: 'var(--text-main)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {CSV_SAMPLE}
              </pre>
            </div>

            {/* File Upload zone */}
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('bulk-csv-input')?.click()}
            >
              <input
                id="bulk-csv-input"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <Upload size={28} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                {fileName ? fileName : 'Choose CSV file or drag and drop here'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Maximum size: 2MB. UTF-8 encoded.
              </div>
            </div>

            {/* Manual text area */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                Or paste CSV text directly:
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={CSV_SAMPLE}
                rows={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button variant="primary" icon={<ArrowRight size={15} />} onClick={parseAndPreview} disabled={!csvText.trim()}>
                Preview &amp; Validate Records
              </Button>
            </div>
          </div>
        )}

        {step === 'PREVIEW' && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>VALID RECORDS</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{validCount}</div>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: dupCount > 0 ? '#fffbeb' : '#f8fafc',
                  border: '1px solid',
                  borderColor: dupCount > 0 ? '#fde68a' : 'var(--border-color)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: dupCount > 0 ? '#b45309' : 'var(--text-muted)' }}>
                  DUPLICATES
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: dupCount > 0 ? '#b45309' : 'var(--text-muted)', marginTop: '2px' }}>
                  {dupCount}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: invalidCount > 0 ? '#fef2f2' : '#f8fafc',
                  border: '1px solid',
                  borderColor: invalidCount > 0 ? '#fca5a5' : 'var(--border-color)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: invalidCount > 0 ? '#b91c1c' : 'var(--text-muted)' }}>
                  INVALID ROWS
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: invalidCount > 0 ? '#b91c1c' : 'var(--text-muted)', marginTop: '2px' }}>
                  {invalidCount}
                </div>
              </div>
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              <Table
                data={parsedRows}
                keyExtractor={(r: ParsedRow) => r.primaryUrl + r.name}
                columns={[
                  { header: 'Website Name', accessor: 'name' },
                  {
                    header: 'Target Base URL',
                    render: (r) => <code style={{ fontSize: '11.5px' }}>{r.primaryUrl}</code>,
                  },
                  {
                    header: 'Validation',
                    render: (r) => {
                      if (r.status === 'VALID') {
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
                            <CheckCircle2 size={13} /> Valid
                          </span>
                        );
                      }
                      if (r.status === 'DUPLICATE') {
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b45309', fontSize: '11px', fontWeight: 700 }} title={r.message}>
                            <AlertTriangle size={13} /> Duplicate
                          </span>
                        );
                      }
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '11px', fontWeight: 700 }} title={r.message}>
                          <XCircle size={13} /> Invalid
                        </span>
                      );
                    },
                  },
                  {
                    header: 'Details',
                    render: (r) => <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.message}</span>,
                  },
                ]}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="secondary" onClick={() => setStep('INPUT')}>
                ← Edit Records
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmImport}
                disabled={validCount === 0 || isSubmitting}
                icon={isSubmitting ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={14} />}
              >
                {isSubmitting ? 'Registering Websites...' : `Confirm & Register ${validCount} Website(s)`}
              </Button>
            </div>
          </div>
        )}

        {step === 'RESULT' && result && (
          <div>
            <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
              <CheckCircle2 size={44} color="#15803d" style={{ marginBottom: '8px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>
                Bulk Import Completed
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {result.summary}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Processed</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>{result.totalRecords}</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#047857', textTransform: 'uppercase' }}>Registered</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857' }}>{result.importedCount}</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a', textAlign: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#b45309', textTransform: 'uppercase' }}>Duplicates</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#b45309' }}>{result.duplicateCount}</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fca5a5', textAlign: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#b91c1c', textTransform: 'uppercase' }}>Failed</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#b91c1c' }}>{result.failedCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={() => {
                  handleModalClose();
                  onSuccess();
                }}
              >
                Close &amp; Refresh Global Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
