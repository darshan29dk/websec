export type ReportType =
  | 'EXECUTIVE_SECURITY_REPORT'
  | 'TECHNICAL_SECURITY_REPORT'
  | 'VULNERABILITY_REPORT'
  | 'ASSESSMENT_REPORT'
  | 'INCIDENT_REPORT'
  | 'FORENSIC_REPORT'
  | 'DEFENSE_VALIDATION_REPORT'
  | 'SECURITY_POSTURE_REPORT'
  | 'REGRESSION_REPORT'
  | 'MONITORING_REPORT';

export type ReportStatus = 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export type ReportFormat = 'PDF' | 'HTML' | 'CSV' | 'JSON';

export interface CreateReportRequestDto {
  reportType: ReportType;
  format: ReportFormat;
  targetId?: string;
  assessmentId?: string;
  incidentId?: string;
  title?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface SecurityReportDto {
  id: string;
  uuid: string;
  reportType: ReportType;
  title: string;
  targetId?: string;
  targetName?: string;
  assessmentId?: string;
  incidentId?: string;
  generatedBy: string;
  status: ReportStatus;
  format: ReportFormat;
  periodStart?: string;
  periodEnd?: string;
  checksum?: string;
  fileSize: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}
