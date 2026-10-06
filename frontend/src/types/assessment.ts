import { Target } from './target';

export type ProfileType = 'PASSIVE' | 'STANDARD_AUTHORIZED' | 'COMPREHENSIVE_AUTHORIZED';
export type AssessmentStatus = 'DRAFT' | 'QUEUED' | 'VALIDATING' | 'RUNNING' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED' | 'CANCELLED';
export type AssessmentStage = 
  | 'TARGET_VALIDATION'
  | 'DNS_DISCOVERY'
  | 'PORT_DISCOVERY'
  | 'TECHNOLOGY_DISCOVERY'
  | 'HTTP_SECURITY_ANALYSIS'
  | 'WEB_SERVER_ASSESSMENT'
  | 'VULNERABILITY_ASSESSMENT'
  | 'RESULT_NORMALIZATION'
  | 'FINALIZATION';

export type ToolExecutionStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED' | 'NOT_AVAILABLE';

export interface AssessmentProfile {
  id: string;
  name: string;
  description: string;
  profileType: ProfileType;
  enabled: boolean;
  createdAt: string;
}

export interface Assessment {
  id: string;
  targetId: string;
  targetName: string;
  targetPrimaryUrl: string;
  target?: Target;
  profileId: string;
  profileName: string;
  profileType: ProfileType;
  status: AssessmentStatus;
  authorizationConfirmed: boolean;
  currentStage?: AssessmentStage;
  progressPercent?: number;
  queuedAt?: string;
  validationStartedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  statusMessage?: string;
}

export interface CreateAssessmentRequest {
  targetId: string;
  profileId: string;
  authorizationConfirmed: boolean;
}

export interface ToolExecution {
  id: string;
  assessmentId: string;
  toolName: string;
  stage: AssessmentStage;
  status: ToolExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  exitCode?: number;
  stdoutReference?: string;
  stderrReference?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface AssessmentAssetItem {
  id: string;
  assessmentId: string;
  assetType: string;
  value: string;
  source: string;
  confidence: string;
  createdAt: string;
}

export interface AssessmentEndpointItem {
  id: string;
  assessmentId: string;
  url: string;
  method: string;
  statusCode?: number;
  contentType?: string;
  source: string;
  discoveredAt: string;
}

export interface AssessmentObservationItem {
  id: string;
  assessmentId: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  confidence: string;
  source: string;
  evidence: string;
  createdAt: string;
}

export interface SecurityToolStatus {
  tool: string;
  configured: boolean;
  available: boolean;
  version?: string;
  status: string;
}
