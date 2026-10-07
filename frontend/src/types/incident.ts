import { SourceIpConfidence } from './event';

export type IncidentSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type IncidentStatus = 'NEW' | 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED' | 'FALSE_POSITIVE';

export interface SecurityIncident {
  id: string;
  uuid: string;
  targetId: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  confidence: IncidentConfidence;
  status: IncidentStatus;
  correlationKey: string;
  sourceIp?: string;
  sourceIpConfidence: SourceIpConfidence;
  firstObservedAt: string;
  lastObservedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
