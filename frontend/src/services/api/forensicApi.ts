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
  getCases: async (params?: { targetId?: string; status?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<ForensicCase>>>('/forensics/cases', { params });
    return response.data;
  },

  getCaseById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<ForensicCase>>(`/forensics/cases/${id}`);
    return response.data;
  },

  createCase: async (data: CreateCaseRequest) => {
    const response = await apiClient.post<ApiResponse<ForensicCase>>('/forensics/cases', data);
    return response.data;
  },

  createCaseFromIncident: async (incidentId: string) => {
    const response = await apiClient.post<ApiResponse<ForensicCase>>(`/incidents/${incidentId}/forensic-case`);
    return response.data;
  },

  closeCase: async (id: string, status?: string) => {
    const response = await apiClient.post<ApiResponse<ForensicCase>>(`/forensics/cases/${id}/close`, null, {
      params: { status }
    });
    return response.data;
  },

  getEvidence: async (caseId: string, params?: { page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<ForensicEvidence>>>(`/forensics/cases/${caseId}/evidence`, { params });
    return response.data;
  },

  addEvidence: async (caseId: string, data: AddEvidenceRequest) => {
    const response = await apiClient.post<ApiResponse<ForensicEvidence>>(`/forensics/cases/${caseId}/evidence`, data);
    return response.data;
  },

  verifyEvidence: async (evidenceId: string) => {
    const response = await apiClient.post<ApiResponse<EvidenceVerification>>(`/forensics/evidence/${evidenceId}/verify`);
    return response.data;
  },

  getTimeline: async (caseId: string, params?: { page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<TimelineEvent>>>(`/forensics/cases/${caseId}/timeline`, { params });
    return response.data;
  },

  getHttpEvents: async (caseId: string, params?: { page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<HttpForensicEvent>>>(`/forensics/cases/${caseId}/http-events`, { params });
    return response.data;
  },

  getNetworkEvents: async (caseId: string, params?: { page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<NetworkForensicEvent>>>(`/forensics/cases/${caseId}/network-events`, { params });
    return response.data;
  },

  getAttackEvents: async (caseId: string) => {
    const response = await apiClient.get<ApiResponse<AttackEvent[]>>(`/forensics/cases/${caseId}/attack-events`);
    return response.data;
  },

  getAttackChain: async (caseId: string) => {
    const response = await apiClient.get<ApiResponse<AttackChain>>(`/forensics/cases/${caseId}/attack-chain`);
    return response.data;
  },

  getSummary: async (caseId: string) => {
    const response = await apiClient.get<ApiResponse<ForensicSummary>>(`/forensics/cases/${caseId}/summary`);
    return response.data;
  }
};
