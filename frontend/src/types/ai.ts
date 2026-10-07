export interface AiAnalysisClaim {
  id: number;
  uuid: string;
  investigationId: number;
  claimType: 'OBSERVED_FACT' | 'INFERENCE' | 'HYPOTHESIS' | 'RECOMMENDATION';
  claimText: string;
  confidence: number;
  validationStatus: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'NOT_VERIFIABLE';
  createdAt: string;
}

export interface AiEvidenceReference {
  id: number;
  investigationId: number;
  claimId?: number;
  evidenceType: 'FINDING' | 'HTTP_EVENT' | 'FORENSIC_ARTIFACT' | 'ATTACK_EVENT' | 'TIMELINE_EVENT';
  evidenceId: string;
  relationship: 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT';
  details?: string;
  createdAt: string;
}

export interface AiKnowledgeReference {
  id: number;
  investigationId: number;
  documentId?: number;
  chunkId?: number;
  relevanceScore: number;
  citationText: string;
  createdAt: string;
}

export interface AiInvestigation {
  id: number;
  uuid: string;
  assessmentId?: number;
  incidentId?: number;
  requestedBy: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  provider: string;
  model: string;
  promptVersion?: string;
  confidence?: number;
  confidenceBasis?: string;
  verdict?: string;
  summary?: string;
  whatHappened?: string;
  timelineSummary?: string;
  affectedTargetSummary?: string;
  affectedEndpointsSummary?: string;
  rootCause?: string;
  impact?: string;
  supportingEvidenceSummary?: string;
  contradictingEvidenceSummary?: string;
  missingEvidenceSummary?: string;
  recommendedNextSteps?: string;
  limitations?: string;
  failureReason?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  claims: AiAnalysisClaim[];
  evidenceReferences: AiEvidenceReference[];
  knowledgeReferences: AiKnowledgeReference[];
}

export interface AiInvestigationRequest {
  assessmentId?: number;
  incidentId?: number;
}

export interface AiQuestionRequest {
  question: string;
}

export interface AiQuestionResponse {
  question: string;
  answer: string;
  confidenceBasis?: string;
  evidenceCitations: string[];
  knowledgeCitations: string[];
}
