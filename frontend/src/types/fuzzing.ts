export type FuzzingProfile =
  | 'PASSIVE_BASELINE'
  | 'SAFE_ACTIVE_FUZZ'
  | 'MULTI_STEP_SEQUENCE'
  | 'AUTH_SESSION_FUZZ';

export type FuzzingStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type TestCaseStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'BLOCKED';

export type TestResultClassification =
  | 'PASSED'
  | 'SUSPICIOUS'
  | 'VULNERABILITY_CONFIRMED'
  | 'ERROR'
  | 'SKIPPED'
  | 'BLOCKED';

export type CoverageStatus =
  | 'NOT_SUPPORTED'
  | 'NOT_CONFIGURED'
  | 'NOT_RUN'
  | 'BLOCKED'
  | 'PASSED'
  | 'SUSPECTED'
  | 'CONFIRMED';

export interface FuzzingCampaign {
  id: string;
  targetId: string;
  targetName?: string;
  targetPrimaryUrl?: string;
  assessmentId?: string;
  name: string;
  profile: FuzzingProfile;
  status: FuzzingStatus;
  targetScopeSnapshot?: string;
  rateLimitRps: number;
  maxRequests: number;
  timeoutMs: number;
  concurrency: number;
  categories?: string;
  totalTestCases: number;
  executedTestCases: number;
  findingsCount: number;
  suspiciousCount: number;
  durationMs?: number;
  errorMessage?: string;
  createdBy?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progressPercent: number;
}

export interface FuzzingTestCase {
  id: string;
  campaignId: string;
  endpointId?: string;
  category: string;
  name: string;
  httpMethod: string;
  targetUrl: string;
  parameterName?: string;
  payloadType: string;
  testPayload?: string;
  baselinePayload?: string;
  executionOrder: number;
  multiStep: boolean;
  stepIndex: number;
  preconditions?: string;
  stopCondition?: string;
  status: TestCaseStatus;
  createdAt: string;
}

export interface FuzzingExecutionRecord {
  id: string;
  campaignId: string;
  testCaseId: string;
  testCaseName?: string;
  category?: string;
  parameterName?: string;
  payloadType?: string;
  requestUrl: string;
  requestMethod: string;
  requestHeadersSanitized?: string;
  requestBodySanitized?: string;
  responseStatus?: number;
  responseTimeMs?: number;
  responseHeadersSanitized?: string;
  responseBodySnippet?: string;
  responseHash?: string;
  baselineStatus?: number;
  baselineDiffSummary?: string;
  resultClassification: TestResultClassification;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CERTAIN';
  anomalyDetails?: string;
  findingId?: string;
  errorMessage?: string;
  executedAt: string;
}

export interface FuzzingCoverageResult {
  id: string;
  campaignId: string;
  owaspCategory: string;
  categoryName: string;
  supportedChecksCount: number;
  executedChecksCount: number;
  status: CoverageStatus;
  limitationsNotes?: string;
  testedAt: string;
}

export interface CreateFuzzingCampaignRequest {
  targetId: string;
  assessmentId?: string;
  name: string;
  profile: FuzzingProfile;
  rateLimitRps?: number;
  maxRequests?: number;
  timeoutMs?: number;
  concurrency?: number;
  categories?: string[];
  selectedEndpointIds?: string[];
  customHeaders?: string;
  enableMultiStepSequences?: boolean;
}

export interface ReproduceTestCaseRequest {
  testCaseId: string;
  customPayloadOverride?: string;
}

export interface ReproduceTestCaseResponse {
  testCaseId: string;
  requestUrl: string;
  requestMethod: string;
  requestHeadersSanitized?: string;
  requestBodySanitized?: string;
  responseStatus?: number;
  responseTimeMs?: number;
  responseHeadersSanitized?: string;
  responseBodySnippet?: string;
  classification: TestResultClassification;
  anomalyDetails?: string;
  reproduced: boolean;
  summaryMessage: string;
  executedAt: string;
}

export interface LinkFindingRequest {
  findingId: string;
  investigationId?: string;
  createRemediationPlan: boolean;
  remediationPlanTitle?: string;
}
