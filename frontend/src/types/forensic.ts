export type CaseStatus = 'OPEN' | 'INVESTIGATING' | 'EVIDENCE_COMPLETE' | 'CLOSED' | 'INCONCLUSIVE';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EvidenceType = 'HTTP_REQUEST' | 'HTTP_RESPONSE' | 'NETWORK_EVENT' | 'APPLICATION_LOG' | 'SECURITY_LOG' | 'AUTHENTICATION_EVENT' | 'ASSESSMENT_EVENT' | 'TOOL_OUTPUT' | 'DNS_EVENT' | 'TLS_EVENT' | 'FILE_ARTIFACT' | 'PROCESS_EVENT' | 'USER_AGENT' | 'OTHER';
export type EvidenceSourceType = 'SERVER_LOG' | 'REVERSE_PROXY' | 'WEB_SERVER' | 'APPLICATION' | 'FIREWALL' | 'NETWORK_SENSOR' | 'AEGIS_ASSESSMENT' | 'SECURITY_TOOL' | 'MANUAL_UPLOAD' | 'LAB_TELEMETRY';
export type IntegrityStatus = 'VERIFIED' | 'UNVERIFIED' | 'MODIFIED' | 'UNKNOWN';
export type EvidenceConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type EvidenceClassification = 'OBSERVED' | 'DERIVED' | 'INFERRED';
export type TimelineEventType = 'RECONNAISSANCE' | 'HTTP_REQUEST' | 'HTTP_RESPONSE' | 'AUTHENTICATION' | 'AUTHORIZATION_EVENT' | 'SUSPICIOUS_REQUEST' | 'VULNERABILITY_INTERACTION' | 'NETWORK_CONNECTION' | 'ERROR' | 'FILE_EVENT' | 'PROCESS_EVENT' | 'SECURITY_ALERT' | 'ASSESSMENT_EVENT' | 'OTHER';
export type AttackStage = 'RECONNAISSANCE' | 'DISCOVERY' | 'INITIAL_ACCESS' | 'VULNERABILITY_INTERACTION' | 'AUTHENTICATION_ACTIVITY' | 'SUSPICIOUS_REQUEST' | 'POSSIBLE_EXPLOITATION' | 'IMPACT' | 'POSSIBLE_EXFILTRATION';

export interface ForensicCase {
  id: string;
  uuid: string;
  incidentId?: string;
  assessmentId?: string;
  targetId: string;
  targetName: string;
  caseNumber: string;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  createdByEmail?: string;
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  unverifiedEvidenceCount: number;
}

export interface ForensicEvidence {
  id: string;
  uuid: string;
  caseId: string;
  evidenceType: EvidenceType;
  sourceType: EvidenceSourceType;
  sourceReference?: string;
  eventTime?: string;
  collectionTime: string;
  contentHash: string;
  integrityStatus: IntegrityStatus;
  confidence: EvidenceConfidence;
  classification: EvidenceClassification;
  provenance: string;
  description?: string;
  metadata?: string;
  createdAt: string;
}

export interface EvidenceVerification {
  evidenceId: string;
  storedHash: string;
  calculatedHash: string;
  status: IntegrityStatus;
  verifiedAt: string;
  message: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  eventTime?: string;
  timeDescription?: string;
  eventType: TimelineEventType;
  source: string;
  severity: string;
  title: string;
  description?: string;
  evidenceId?: string;
  confidence: EvidenceConfidence;
  sequenceNumber: number;
  createdAt: string;
}

export interface HttpForensicEvent {
  id: string;
  caseId: string;
  evidenceId?: string;
  eventTime: string;
  sourceIp?: string;
  destinationIp?: string;
  method: string;
  scheme: string;
  host: string;
  port: number;
  path: string;
  queryString?: string;
  httpVersion?: string;
  statusCode?: number;
  requestHeaders?: string;
  responseHeaders?: string;
  userAgent?: string;
  referer?: string;
  contentType?: string;
  contentLength?: number;
  tlsVersion?: string;
  createdAt: string;
}

export interface NetworkForensicEvent {
  id: string;
  caseId: string;
  evidenceId?: string;
  eventTime: string;
  sourceIp?: string;
  sourcePort?: number;
  destinationIp?: string;
  destinationPort?: number;
  protocol: string;
  direction?: string;
  connectionState?: string;
  bytesIn?: number;
  bytesOut?: number;
  sensorSource?: string;
  metadata?: string;
  createdAt: string;
}

export interface AttackEvent {
  id: string;
  caseId: string;
  timelineEventId?: string;
  eventType: string;
  stage: AttackStage;
  eventTime?: string;
  sourceIp?: string;
  targetEndpoint?: string;
  httpMethod?: string;
  statusCode?: number;
  evidenceId?: string;
  confidence: EvidenceConfidence;
  classification: EvidenceClassification;
  description?: string;
  createdAt: string;
}

export interface AttackChain {
  caseId: string;
  events: AttackEvent[];
  totalObservedNodes: number;
  totalDerivedNodes: number;
  totalInferredNodes: number;
}

export interface ForensicSummary {
  caseId: string;
  caseNumber: string;
  title: string;
  status: string;
  observedSourceIp?: string;
  sourceIpOrigin: string;
  factualFindings: string[];
  assessmentSummary: string;
  exploitationEstablished: boolean;
  attributionStatus: string;
}

export interface CreateCaseRequest {
  targetId: string;
  incidentId?: string;
  assessmentId?: string;
  title: string;
  priority?: CasePriority;
}

export interface AddEvidenceRequest {
  evidenceType: EvidenceType;
  sourceType: EvidenceSourceType;
  sourceReference?: string;
  eventTime?: string;
  provenance: string;
  content: string;
  description?: string;
  metadata?: string;
  confidence?: EvidenceConfidence;
  classification?: EvidenceClassification;
}
