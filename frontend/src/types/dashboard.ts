import { Target } from './target';
import { Assessment } from './assessment';

export interface TargetRiskEvaluation {
  riskCategory: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_ASSESSED';
  riskScore: number | null;
  criticalOverrideApplied: boolean;
  contributingFactors: string[];
  openCriticalCount: number;
  openHighCount: number;
  openMediumCount: number;
  openLowCount: number;
  totalOpenCount: number;
}

export interface GlobalDashboardOverview {
  totalWebsites: number;
  criticalRiskWebsites: number;
  highRiskWebsites: number;
  mediumRiskWebsites: number;
  lowRiskWebsites: number;
  unassessedWebsites: number;

  totalDiscoveredEndpoints: number;

  totalUniqueOpenFindings: number;
  criticalOpenFindings: number;
  highOpenFindings: number;
  mediumOpenFindings: number;
  lowOpenFindings: number;

  findingsResolved: number;
  verifiedFixes: number;

  assessmentsByStatus: Record<string, number>;
  incidentsByStatus: Record<string, number>;

  telemetryConfigured: boolean;
  telemetryStatusMessage: string;

  monitoringActiveCount: number;
  monitoringCoveragePercent: number;
  latestMonitoringStatus: string;

  overallPostureScore: number | null;
  overallPostureStatus: 'STRONG' | 'WARNING' | 'AT_RISK' | 'NOT_ASSESSED';
  riskCalculationMethodology: string;
}

export interface GlobalDashboardCharts {
  riskDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  findingsBySeverity: Array<{
    severity: string;
    count: number;
  }>;
  highestRiskWebsites: Array<{
    targetId: string;
    name: string;
    primaryUrl: string;
    riskCategory: string;
    riskScore: number | null;
    openCriticalFindings: number;
    openHighFindings: number;
  }>;
  findingsTimeline: Array<{
    period: string;
    discovered: number;
    resolved: number;
  }>;
  assessmentStatuses: Array<{
    status: string;
    count: number;
  }>;
  remediationRetestOutcomes: Array<{
    status: string;
    count: number;
  }>;
  postureTrends: Array<{
    label: string;
    score: number;
  }>;
  recentSecurityActivity: Array<{
    eventType: string;
    description: string;
    targetName: string;
    timestamp: string;
  }>;
}

export interface TargetDashboardOverview {
  target: Target;
  riskEvaluation: TargetRiskEvaluation;
  discoveredEndpointsCount: number;
  totalAssessmentsCount: number;
  latestAssessment: Assessment | null;
  uniqueOpenFindings: number;
  criticalOpenFindings: number;
  highOpenFindings: number;
  mediumOpenFindings: number;
  lowOpenFindings: number;
  resolvedFindings: number;
  verifiedFixes: number;
  activeIncidents: number;
  monitoringEnabled: boolean;
  monitoringFrequency: string | null;
  monitoringStatus: string;
  postureScore: number | null;
  postureRiskLevel: string;
  recentActivity: string[];
}

export interface BulkImportRequest {
  csvContent?: string;
  entries?: Array<{
    name: string;
    primaryUrl: string;
    description?: string;
  }>;
}

export interface BulkImportResponse {
  totalRecords: number;
  importedCount: number;
  duplicateCount: number;
  skippedCount: number;
  failedCount: number;
  successfulRecords: Target[];
  duplicateRecords: Array<{
    name: string;
    primaryUrl: string;
    reason: string;
  }>;
  failedRecords: Array<{
    name: string;
    primaryUrl: string;
    error: string;
  }>;
  summary: string;
}

export interface DiscoveredEndpoint {
  id: string;
  url: string;
  normalizedUrl: string;
  path: string;
  method: string;
  endpointType: string;
  statusCode?: number;
  contentType?: string;
  parametersPresent: boolean;
  authenticationObserved: boolean;
  source: string;
  confidence: string;
  firstSeenAt: string;
  lastSeenAt: string;
}
