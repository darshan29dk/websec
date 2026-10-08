import client from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import { SecurityIncident, IncidentSeverity, IncidentStatus } from '../../types/incident';
import { SecurityEvent } from '../../types/event';
import { Investigation, TimelineEvent, InvestigationEvidence } from '../../types/investigation';
import { SecurityFinding } from '../../types/finding';

export const incidentApi = {
  getIncidents: async (
    page = 0,
    size = 20,
    targetId?: string,
    severity?: IncidentSeverity,
    status?: IncidentStatus
  ): Promise<PageResponse<SecurityIncident>> => {
    const params: Record<string, any> = { page, size };
    if (targetId) params.targetId = targetId;
    if (severity) params.severity = severity;
    if (status) params.status = status;

    return client.get<PageResponse<SecurityIncident>>('/incidents', { params });
  },

  getIncidentById: async (id: string): Promise<SecurityIncident> => {
    return client.get<SecurityIncident>(`/incidents/${id}`);
  },

  updateStatus: async (id: string, status: IncidentStatus): Promise<SecurityIncident> => {
    return client.patch<SecurityIncident>(`/incidents/${id}/status`, { status });
  },

  getEventsForIncident: async (id: string): Promise<SecurityEvent[]> => {
    return client.get<SecurityEvent[]>(`/incidents/${id}/events`);
  },

  getTimelineForIncident: async (id: string): Promise<TimelineEvent[]> => {
    return client.get<TimelineEvent[]>(`/incidents/${id}/timeline`);
  },

  getAttackChainForIncident: async (id: string): Promise<any> => {
    return client.get<any>(`/incidents/${id}/attack-chain`);
  },

  getEvidenceForIncident: async (id: string): Promise<InvestigationEvidence[]> => {
    return client.get<InvestigationEvidence[]>(`/incidents/${id}/evidence`);
  },

  getRelatedFindingsForIncident: async (id: string): Promise<SecurityFinding[]> => {
    return client.get<SecurityFinding[]>(`/incidents/${id}/related-findings`);
  },

  createOrGetInvestigation: async (id: string): Promise<Investigation> => {
    return client.post<Investigation>(`/incidents/${id}/investigation`);
  }
};
