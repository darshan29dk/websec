export type PostureRiskLevel =
  | 'EXCELLENT'
  | 'GOOD'
  | 'MODERATE'
  | 'HIGH_RISK'
  | 'CRITICAL_RISK'
  | 'INSUFFICIENT_DATA';

export type PostureStatus = 'VALID' | 'INSUFFICIENT_DATA' | 'OUT_OF_CURRENT_SCOPE';

export type PostureDimensionType =
  | 'VULNERABILITY_RISK'
  | 'ATTACK_SURFACE_RISK'
  | 'CONFIGURATION_SECURITY'
  | 'REMEDIATION_HEALTH'
  | 'DEFENSE_VALIDATION'
  | 'REGRESSION_RISK';

export type RegressionType = 'REOPENED' | 'REGRESSED' | 'NEW_RISK' | 'DEFENSE_REGRESSION';

export type RegressionConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';

export type RegressionStatus = 'CONFIRMED' | 'POTENTIAL' | 'INCONCLUSIVE' | 'RESOLVED';

export interface PostureScoreFactorDto {
  id: string;
  uuid: string;
  snapshotId: string;
  dimension: PostureDimensionType;
  factorType: string;
  factorName: string;
  impact: number;
  weight: number;
  evidenceReference?: string;
  explanation: string;
  createdAt: string;
}

export interface SecurityPostureDimensionDto {
  id: string;
  uuid: string;
  snapshotId: string;
  dimension: PostureDimensionType;
  score: number | null;
  status: PostureStatus;
  evidenceCount: number;
  explanation: string;
  createdAt: string;
  factors: PostureScoreFactorDto[];
}

export interface SecurityPostureSnapshotDto {
  id: string;
  uuid: string;
  targetId: string;
  assessmentId?: string;
  overallScore: number;
  riskLevel: PostureRiskLevel;
  scoreStatus: PostureStatus;
  previousScore?: number;
  scoreDelta?: number;
  scoreVersion: string;
  calculatedAt: string;
  createdAt: string;
  dimensions: SecurityPostureDimensionDto[];
  factors: PostureScoreFactorDto[];
}

export interface SecurityRegressionDto {
  id: string;
  uuid: string;
  targetId: string;
  previousAssessmentId?: string;
  currentAssessmentId?: string;
  findingFingerprint: string;
  previousFindingId?: string;
  currentFindingId?: string;
  findingTitle: string;
  regressionType: RegressionType;
  confidence: RegressionConfidence;
  status: RegressionStatus;
  explanation: string;
  detectedAt: string;
  createdAt: string;
}

export interface FindingSummaryItem {
  findingId: string;
  fingerprint: string;
  title: string;
  severity: string;
  status: string;
  endpoint: string;
}

export interface AssessmentComparisonDto {
  targetId: string;
  previousAssessmentId?: string;
  currentAssessmentId: string;
  previousScore?: number;
  currentScore?: number;
  scoreDelta?: number;
  newFindings: FindingSummaryItem[];
  fixedFindings: FindingSummaryItem[];
  unchangedFindings: FindingSummaryItem[];
  reopenedFindings: FindingSummaryItem[];
  newExposures: string[];
  removedExposures: string[];
  changedTechnologies: string[];
  retestChanges: string[];
  defenseValidationChanges: string[];
  summaryExplanation: string;
}

export interface PostureTrendPointDto {
  snapshotId: string;
  assessmentId?: string;
  score: number;
  riskLevel: PostureRiskLevel;
  timestamp: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  regressionCount: number;
}

export interface RegressionSummaryDto {
  targetId: string;
  totalRegressions: number;
  confirmedRegressions: number;
  potentialRegressions: number;
  resolvedRegressions: number;
  regressionRate: number;
  recentRegressions: SecurityRegressionDto[];
}
