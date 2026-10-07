export type SecurityEventType = 
  | 'HTTP_REQUEST'
  | 'HTTP_RESPONSE'
  | 'NETWORK_CONNECTION'
  | 'AUTHENTICATION_EVENT'
  | 'SUSPICIOUS_REQUEST'
  | 'VULNERABILITY_INTERACTION';

export type EventSource = 
  | 'ASSESSMENT_TOOL'
  | 'WEB_SERVER_LOG'
  | 'REVERSE_PROXY'
  | 'WAF'
  | 'APPLICATION_LOG'
  | 'NETWORK_SENSOR'
  | 'MANUAL_IMPORT'
  | 'LAB_SIMULATION';

export type SourceIpConfidence = 'OBSERVED' | 'DERIVED' | 'UNKNOWN';

export interface SecurityEvent {
  id: string;
  uuid: string;
  targetId: string;
  assessmentId?: string;
  eventType: SecurityEventType;
  eventTime: string;
  observedAt: string;
  sourceIp?: string;
  sourceIpConfidence: SourceIpConfidence;
  sourcePort?: number;
  destinationIp?: string;
  destinationPort?: number;
  httpMethod?: string;
  url?: string;
  path?: string;
  queryParameters?: string;
  statusCode?: number;
  userAgent?: string;
  requestSize?: number;
  responseSize?: number;
  protocol?: string;
  eventSource: EventSource;
  rawReference?: string;
  normalizedData?: string;
  createdAt: string;
}

export interface DetectionMatch {
  id: string;
  uuid: string;
  ruleId: string;
  targetId: string;
  eventId: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  matchedAt: string;
  evidence: string;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ESCALATED';
  createdAt: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  eventType: SecurityEventType;
  severity: string;
  confidence: string;
  conditions: string;
  enabled: boolean;
}
