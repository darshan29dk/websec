import client from './client';
import {
  AiInvestigation,
  AiInvestigationRequest,
  AiAnalysisClaim,
  AiEvidenceReference,
  AiKnowledgeReference,
  AiQuestionRequest,
  AiQuestionResponse,
} from '../../types/ai';

export const aiApi = {
  createInvestigation: async (request: AiInvestigationRequest): Promise<AiInvestigation> => {
    return client.post<AiInvestigation>('/ai/investigations', request);
  },

  getAllInvestigations: async (): Promise<AiInvestigation[]> => {
    return client.get<AiInvestigation[]>('/ai/investigations');
  },

  getInvestigationById: async (id: string): Promise<AiInvestigation> => {
    return client.get<AiInvestigation>(`/ai/investigations/${id}`);
  },

  runInvestigation: async (id: string): Promise<AiInvestigation> => {
    return client.post<AiInvestigation>(`/ai/investigations/${id}/run`);
  },

  cancelInvestigation: async (id: string): Promise<AiInvestigation> => {
    return client.post<AiInvestigation>(`/ai/investigations/${id}/cancel`);
  },

  getEvidenceReferences: async (id: string): Promise<AiEvidenceReference[]> => {
    return client.get<AiEvidenceReference[]>(`/ai/investigations/${id}/evidence`);
  },

  getKnowledgeReferences: async (id: string): Promise<AiKnowledgeReference[]> => {
    return client.get<AiKnowledgeReference[]>(`/ai/investigations/${id}/knowledge`);
  },

  getClaims: async (id: string): Promise<AiAnalysisClaim[]> => {
    return client.get<AiAnalysisClaim[]>(`/ai/investigations/${id}/claims`);
  },

  askQuestion: async (id: string, question: string): Promise<AiQuestionResponse> => {
    const req: AiQuestionRequest = { question };
    return client.post<AiQuestionResponse>(`/ai/investigations/${id}/questions`, req);
  },
};
