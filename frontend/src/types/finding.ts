export type FindingType = 
  | 'MISCONFIGURATION'
  | 'EXPOSES_SERVICE'
  | 'SECURITY_HEADER'
  | 'TLS_CONFIGURATION'
  | 'KNOWN_VULNERABILITY'
  | 'WEB_APPLICATION_ALERT'
  | 'INFORMATION_DISCLOSURE'
  | 'OUTDATED_COMPONENT'
  | 'OTHER';

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'UNKNOWN';
export type FindingConfidence = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type FindingStatus = 'OPEN' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'ACCEPTED_RISK' | 'RESOLVED' | 'REOPENED';

export interface SecurityFinding {
  id: string;
  uuid: string;
  assessmentId: string;
  assetId?: string;
  assetValue?: string;
  endpointId?: string;
  endpointUrl?: string;
  title: string;
  description?: string;
  findingType: FindingType;
  severity: FindingSeverity;
  originalSeverity?: string;
  confidence: FindingConfidence;
  status: FindingStatus;
  source: string;
  deduplicationHash: string;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
}

export interface FindingEvidence {
  id: string;
  uuid: string;
  findingId: string;
  evidenceType: string;
  source: string;
  content?: string;
  redactedContent?: string;
  location?: string;
  observedAt: string;
  hash?: string;
}

export interface FindingReference {
  id: string;
  findingId: string;
  referenceType: string;
  referenceId: string;
  url?: string;
  title?: string;
  source: string;
  createdAt: string;
}

export interface FindingCorrelation {
  id: string;
  findingId: string;
  relatedFindingId: string;
  relatedFindingTitle: string;
  correlationType: string;
  confidence: string;
  reason?: string;
  createdAt: string;
}

export interface FindingComment {
  id: string;
  findingId: string;
  authorId: string;
  authorEmail: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindingDetail {
  finding: SecurityFinding;
  evidence: FindingEvidence[];
  references: FindingReference[];
  correlations: FindingCorrelation[];
  comments: FindingComment[];
}

export interface FindingSummary {
  assessmentId: string;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
}
