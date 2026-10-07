export type RetestStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'VALIDATING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type RetestCheckType =
  | 'HTTP_RESPONSE_VALIDATION'
  | 'HEADER_VALIDATION'
  | 'COOKIE_VALIDATION'
  | 'TLS_CONFIGURATION_VALIDATION'
  | 'ENDPOINT_REACHABILITY_VALIDATION'
  | 'VULNERABILITY_RESCAN'
  | 'ZAP_ALERT_REVALIDATION'
  | 'NUCLEI_REVALIDATION'
  | 'CONFIGURATION_REVALIDATION';

export type RetestCheckStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'ERROR'
  | 'NOT_AVAILABLE'
  | 'SKIPPED';

export type ValidationStatus =
  | 'FIXED'
  | 'PARTIALLY_FIXED'
  | 'NOT_FIXED'
  | 'REGRESSED'
  | 'INCONCLUSIVE';

export type ValidationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type ValidationResultType =
  | 'EXPECTED'
  | 'UNEXPECTED'
  | 'CHANGED'
  | 'UNCHANGED'
  | 'NOT_OBSERVABLE'
  | 'ERROR';

export interface RetestCheck {
  id: string;
  uuid: string;
  checkType: RetestCheckType;
  toolName: string;
  targetReference?: string;
  endpointReference?: string;
  parameterReference?: string;
  expectedCondition: string;
  status: RetestCheckStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RetestEvidence {
  id: string;
  uuid: string;
  checkId?: string;
  source: string;
  evidenceType: string;
  contentHash?: string;
  evidenceData: string;
  createdAt: string;
}

export interface ValidationResult {
  id: string;
  uuid: string;
  checkId: string;
  resultType: ValidationResultType;
  expectedValue?: string;
  observedValue?: string;
  comparisonResult?: string;
  confidence: ValidationConfidence;
  evidenceReference?: string;
  createdAt: string;
}

export interface DefenseValidation {
  id: string;
  uuid: string;
  findingId: string;
  retestId: string;
  validationStatus: ValidationStatus;
  confidence: ValidationConfidence;
  summary: string;
  validatedBy: string;
  validatedAt: string;
  createdAt: string;
  results?: ValidationResult[];
}

export interface Retest {
  id: string;
  uuid: string;
  findingId: string;
  findingTitle?: string;
  assessmentId: string;
  targetId: string;
  targetName?: string;
  targetUrl?: string;
  requestedBy: string;
  status: RetestStatus;
  reason?: string;
  authorizationConfirmed: boolean;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  checks?: RetestCheck[];
  validation?: DefenseValidation;
}

export interface RemediationStatusHistory {
  id: string;
  uuid: string;
  findingId: string;
  previousStatus?: string;
  newStatus: string;
  changedBy: string;
  reason?: string;
  source: string;
  createdAt: string;
}

export interface RetestDashboardMetrics {
  totalRetests: number;
  openFindings: number;
  awaitingRetest: number;
  currentlyRetesting: number;
  fixedCount: number;
  partiallyFixedCount: number;
  notFixedCount: number;
  regressedCount: number;
  inconclusiveCount: number;
}
