import client from './client';
import { PageResponse } from '../../types/common';
import {
  Investigation,
  InvestigationStatus,
  InvestigationHypothesis,
  HypothesisStatus,
  InvestigationEvidence,
  InvestigationNote,
  TimelineEvent,
  InvestigationConclusion
} from '../../types/investigation';

export const investigationApi = {
  getInvestigations: async (
    page = 0,
    size = 20,
    status?: InvestigationStatus
  ): Promise<PageResponse<Investigation>> => {
    const params: Record<string, any> = { page, size };
    if (status) params.status = status;

    return client.get<PageResponse<Investigation>>('/investigations', { params });
  },

  getInvestigationById: async (id: string): Promise<any> => {
    return client.get<any>(`/investigations/${id}`);
  },

  addNote: async (id: string, content: string): Promise<InvestigationNote> => {
    return client.post<InvestigationNote>(`/investigations/${id}/notes`, { content });
  },

  addHypothesis: async (id: string, statement: string): Promise<InvestigationHypothesis> => {
    return client.post<InvestigationHypothesis>(`/investigations/${id}/hypotheses`, { statement });
  },

  updateHypothesisStatus: async (hypothesisId: string, status: HypothesisStatus): Promise<InvestigationHypothesis> => {
    return client.post<InvestigationHypothesis>(`/investigations/hypotheses/${hypothesisId}/status`, { status });
  },

  addEvidence: async (id: string, payload: any): Promise<InvestigationEvidence> => {
    return client.post<InvestigationEvidence>(`/investigations/${id}/evidence`, payload);
  },

  linkEvidenceToHypothesis: async (hypothesisId: string, evidenceId: string, relationship = 'SUPPORTING'): Promise<any> => {
    return client.post<any>(`/investigations/hypotheses/${hypothesisId}/link-evidence`, { evidenceId, relationship });
  },

  updateStatus: async (id: string, status: InvestigationStatus, conclusion?: InvestigationConclusion): Promise<Investigation> => {
    return client.patch<Investigation>(`/investigations/${id}/status`, { status, conclusion });
  },

  getTimeline: async (id: string): Promise<TimelineEvent[]> => {
    return client.get<TimelineEvent[]>(`/investigations/${id}/timeline`);
  },

  getAttackChain: async (id: string): Promise<any> => {
    return client.get<any>(`/investigations/${id}/attack-chain`);
  }
};
