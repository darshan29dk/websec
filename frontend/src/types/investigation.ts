export type InvestigationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED';
export type HypothesisStatus = 'PROPOSED' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'REJECTED' | 'INCONCLUSIVE';
export type HypothesisRelationship = 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL';
export type InvestigationConclusion = 'CONFIRMED' | 'LIKELY' | 'SUSPICIOUS' | 'INCONCLUSIVE' | 'FALSE_POSITIVE';
export type AttackNodeType = 'RECONNAISSANCE' | 'PROBE' | 'EXPLOIT_ATTEMPT' | 'AUTHENTICATION_EVENT' | 'ACCESS' | 'IMPACT' | 'UNKNOWN';
export type AttackEdgeRelationship = 'PRECEDES' | 'RELATED_TO' | 'POTENTIALLY_LEADS_TO';

export interface Investigation {
  id: string;
  uuid: string;
  incidentId: string;
  status: InvestigationStatus;
  primaryHypothesis?: string;
  conclusion?: InvestigationConclusion;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface InvestigationHypothesis {
  id: string;
  uuid: string;
  investigationId: string;
  statement: string;
  status: HypothesisStatus;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationEvidence {
  id: string;
  uuid: string;
  investigationId: string;
  evidenceType: string;
  sourceType: string;
  sourceId: string;
  description: string;
  observedAt: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  integrityHash?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  uuid: string;
  investigationId: string;
  eventId?: string;
  eventTime: string;
  eventType: string;
  title: string;
  description?: string;
  source: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export interface InvestigationNote {
  id: string;
  uuid: string;
  investigationId: string;
  authorId?: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttackChainNode {
  id: string;
  uuid: string;
  attackChainId: string;
  nodeType: AttackNodeType;
  referenceType?: string;
  referenceId?: string;
  label: string;
  eventTime: string;
  confidence: string;
  createdAt: string;
}

export interface AttackChainEdge {
  id: string;
  uuid: string;
  attackChainId: string;
  fromNodeId: string;
  toNodeId: string;
  relationship: AttackEdgeRelationship;
  confidence: string;
  createdAt: string;
}
