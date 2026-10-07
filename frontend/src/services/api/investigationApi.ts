import client from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import {
  Investigation,
  InvestigationStatus,
  InvestigationHypothesis,
  HypothesisStatus,
  InvestigationEvidence,
  HypothesisEvidence,
  InvestigationNote,
  TimelineEvent,
  InvestigationConclusion
} from '../../types/investigation';

export const investigationApi = {
  getInvestigations: async (
    page = 0,
    size = 20,
    status?: InvestigationStatus
  ): Promise<ApiResponse<PageResponse<Investigation>>> => {
    const params: Record<string, any> = { page, size };
    if (status) params.status = status;

    const response = await client.get<ApiResponse<PageResponse<Investigation>>>('/api/v1/investigations', { params });
    return response.data;
  },

  getInvestigationById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await client.get<ApiResponse<any>>(`/api/v1/investigations/${id}`);
    return response.data;
  },

  addNote: async (id: string, content: string): Promise<ApiResponse<InvestigationNote>> => {
    const response = await client.post<ApiResponse<InvestigationNote>>(`/api/v1/investigations/${id}/notes`, { content });
    return response.data;
  },

  addHypothesis: async (id: string, statement: string): Promise<ApiResponse<InvestigationHypothesis>> => {
    const response = await client.post<ApiResponse<InvestigationHypothesis>>(`/api/v1/investigations/${id}/hypotheses`, { statement });
    return response.data;
  },

  updateHypothesisStatus: async (hypothesisId: string, status: HypothesisStatus): Promise<ApiResponse<InvestigationHypothesis>> => {
    const response = await client.post<ApiResponse<InvestigationHypothesis>>(`/api/v1/investigations/hypotheses/${hypothesisId}/status`, { status });
    return response.data;
  },

  addEvidence: async (id: string, payload: any): Promise<ApiResponse<InvestigationEvidence>> => {
    const response = await client.post<ApiResponse<InvestigationEvidence>>(`/api/v1/investigations/${id}/evidence`, payload);
    return response.data;
  },

  linkEvidenceToHypothesis: async (hypothesisId: string, evidenceId: string, relationship = 'SUPPORTING'): Promise<ApiResponse<HypothesisEvidence>> => {
    const response = await client.post<ApiResponse<HypothesisEvidence>>(`/api/v1/investigations/hypotheses/${hypothesisId}/link-evidence`, { evidenceId, relationship });
    return response.data;
  },

  updateStatus: async (id: string, status: InvestigationStatus, conclusion?: InvestigationConclusion): Promise<ApiResponse<Investigation>> => {
    const response = await client.patch<ApiResponse<Investigation>>(`/api/v1/investigations/${id}/status`, { status, conclusion });
    return response.data;
  },

  getTimeline: async (id: string): Promise<ApiResponse<TimelineEvent[]>> => {
    const response = await client.get<ApiResponse<TimelineEvent[]>>(`/api/v1/investigations/${id}/timeline`);
    return response.data;
  },

  getAttackChain: async (id: string): Promise<ApiResponse<any>> => {
    const response = await client.get<ApiResponse<any>>(`/api/v1/investigations/${id}/attack-chain`);
    return response.data;
  }
};
