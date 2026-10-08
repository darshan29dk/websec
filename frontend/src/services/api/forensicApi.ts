import { apiClient } from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import {
  ForensicCase,
  ForensicEvidence,
  EvidenceVerification,
  TimelineEvent,
  HttpForensicEvent,
  NetworkForensicEvent,
  AttackEvent,
  AttackChain,
  ForensicSummary,
  CreateCaseRequest,
  AddEvidenceRequest
} from '../../types/forensic';

export const forensicApi = {
  getCases: async (params?: { targetId?: string; status?: string; page?: number; size?: number }): Promise<PageResponse<ForensicCase>> => {
    return apiClient.get<PageResponse<ForensicCase>>('/forensics/cases', { params });
  },

  getCaseById: async (id: string): Promise<ForensicCase> => {
    return apiClient.get<ForensicCase>(`/forensics/cases/${id}`);
  },

  createCase: async (data: CreateCaseRequest): Promise<ForensicCase> => {
    return apiClient.post<ForensicCase>('/forensics/cases', data);
  },

  createCaseFromIncident: async (incidentId: string): Promise<ForensicCase> => {
    return apiClient.post<ForensicCase>(`/incidents/${incidentId}/forensic-case`);
  },

  closeCase: async (id: string, status?: string): Promise<ForensicCase> => {
    return apiClient.post<ForensicCase>(`/forensics/cases/${id}/close`, null, {
      params: { status }
    });
  },

  getEvidence: async (caseId: string, params?: { page?: number; size?: number }): Promise<PageResponse<ForensicEvidence>> => {
    return apiClient.get<PageResponse<ForensicEvidence>>(`/forensics/cases/${caseId}/evidence`, { params });
  },

  addEvidence: async (caseId: string, data: AddEvidenceRequest): Promise<ForensicEvidence> => {
    return apiClient.post<ForensicEvidence>(`/forensics/cases/${caseId}/evidence`, data);
  },

  verifyEvidence: async (evidenceId: string): Promise<EvidenceVerification> => {
    return apiClient.post<EvidenceVerification>(`/forensics/evidence/${evidenceId}/verify`);
  },

  getTimeline: async (caseId: string, params?: { page?: number; size?: number }): Promise<PageResponse<TimelineEvent>> => {
    return apiClient.get<PageResponse<TimelineEvent>>(`/forensics/cases/${caseId}/timeline`, { params });
  },

  getHttpEvents: async (caseId: string, params?: { page?: number; size?: number }): Promise<PageResponse<HttpForensicEvent>> => {
    return apiClient.get<PageResponse<HttpForensicEvent>>(`/forensics/cases/${caseId}/http-events`, { params });
  },

  getNetworkEvents: async (caseId: string, params?: { page?: number; size?: number }): Promise<PageResponse<NetworkForensicEvent>> => {
    return apiClient.get<PageResponse<NetworkForensicEvent>>(`/forensics/cases/${caseId}/network-events`, { params });
  },

  getAttackEvents: async (caseId: string): Promise<AttackEvent[]> => {
    return apiClient.get<AttackEvent[]>(`/forensics/cases/${caseId}/attack-events`);
  },

  getAttackChain: async (caseId: string): Promise<AttackChain> => {
    return apiClient.get<AttackChain>(`/forensics/cases/${caseId}/attack-chain`);
  },

  getSummary: async (caseId: string): Promise<ForensicSummary> => {
    return apiClient.get<ForensicSummary>(`/forensics/cases/${caseId}/summary`);
  }
};
