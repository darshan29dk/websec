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
  ): Promise<ApiResponse<PageResponse<SecurityIncident>>> => {
    const params: Record<string, any> = { page, size };
    if (targetId) params.targetId = targetId;
    if (severity) params.severity = severity;
    if (status) params.status = status;

    const response = await client.get<ApiResponse<PageResponse<SecurityIncident>>>('/api/v1/incidents', { params });
    return response.data;
  },

  getIncidentById: async (id: string): Promise<ApiResponse<SecurityIncident>> => {
    const response = await client.get<ApiResponse<SecurityIncident>>(`/api/v1/incidents/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: IncidentStatus): Promise<ApiResponse<SecurityIncident>> => {
    const response = await client.patch<ApiResponse<SecurityIncident>>(`/api/v1/incidents/${id}/status`, { status });
    return response.data;
  },

  getEventsForIncident: async (id: string): Promise<ApiResponse<SecurityEvent[]>> => {
    const response = await client.get<ApiResponse<SecurityEvent[]>>(`/api/v1/incidents/${id}/events`);
    return response.data;
  },

  getTimelineForIncident: async (id: string): Promise<ApiResponse<TimelineEvent[]>> => {
    const response = await client.get<ApiResponse<TimelineEvent[]>>(`/api/v1/incidents/${id}/timeline`);
    return response.data;
  },

  getAttackChainForIncident: async (id: string): Promise<ApiResponse<any>> => {
    const response = await client.get<ApiResponse<any>>(`/api/v1/incidents/${id}/attack-chain`);
    return response.data;
  },

  getEvidenceForIncident: async (id: string): Promise<ApiResponse<InvestigationEvidence[]>> => {
    const response = await client.get<ApiResponse<InvestigationEvidence[]>>(`/api/v1/incidents/${id}/evidence`);
    return response.data;
  },

  getRelatedFindingsForIncident: async (id: string): Promise<ApiResponse<SecurityFinding[]>> => {
    const response = await client.get<ApiResponse<SecurityFinding[]>>(`/api/v1/incidents/${id}/related-findings`);
    return response.data;
  },

  createOrGetInvestigation: async (id: string): Promise<ApiResponse<Investigation>> => {
    const response = await client.post<ApiResponse<Investigation>>(`/api/v1/incidents/${id}/investigation`);
    return response.data;
  }
};
