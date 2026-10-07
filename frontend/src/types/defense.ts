export interface DefenseControl {
  id: string;
  controlCode: string;
  name: string;
  category: string;
  description: string;
  implementationGuidance?: string;
  validationGuidance?: string;
  createdAt: string;
}

export interface DefenseEvidence {
  id: string;
  uuid: string;
  evidenceType: string;
  sourceType: string;
  sourceId?: string;
  description: string;
  confidence: number;
  createdAt: string;
}

export interface DefenseValidationPlan {
  id: string;
  uuid: string;
  recommendationId: string;
  planTitle: string;
  validationSteps: string[];
  verificationBoundary?: string;
}

export interface DefenseRecommendation {
  id: string;
  uuid: string;
  findingId?: string;
  findingTitle?: string;
  findingSeverity?: string;
  investigationId?: string;
  title: string;
  summary: string;
  rootCause: string;
  rootCauseExplanation?: string;
  recommendationType: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  priorityReasons?: string;
  confidence: number;
  confidenceBasis?: string;
  status: 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED' | 'VERIFIED' | 'SUPERSEDED';
  implementationGuidance?: string;
  compensatingControls?: string;
  implementationRisks?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  primaryControls?: DefenseControl[];
  secondaryControls?: DefenseControl[];
  compensatingControlsList?: DefenseControl[];
  supportingEvidence?: DefenseEvidence[];
  validationPlan?: DefenseValidationPlan;
}

export interface RemediationTask {
  id: string;
  uuid: string;
  planId: string;
  title: string;
  description?: string;
  taskType: string;
  sequence: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  owner: string;
  createdAt: string;
  completedAt?: string;
}

export interface RemediationPlan {
  id: string;
  uuid: string;
  findingId?: string;
  findingTitle?: string;
  recommendationId?: string;
  title: string;
  description?: string;
  priority: string;
  owner: string;
  targetDate?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'IMPLEMENTED' | 'CANCELLED' | 'VERIFICATION_PENDING' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  tasks?: RemediationTask[];
}

export interface DefenseOverviewMetrics {
  openRecommendations: number;
  criticalRemediations: number;
  highPriorityRemediations: number;
  awaitingReview: number;
  implemented: number;
  awaitingVerification: number;
}
