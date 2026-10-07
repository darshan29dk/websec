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
    const response = await client.post<AiInvestigation>('/api/v1/ai/investigations', request);
    return response.data;
  },

  getAllInvestigations: async (): Promise<AiInvestigation[]> => {
    const response = await client.get<AiInvestigation[]>('/api/v1/ai/investigations');
    return response.data;
  },

  getInvestigationById: async (id: string): Promise<AiInvestigation> => {
    const response = await client.get<AiInvestigation>(`/api/v1/ai/investigations/${id}`);
    return response.data;
  },

  runInvestigation: async (id: string): Promise<AiInvestigation> => {
    const response = await client.post<AiInvestigation>(`/api/v1/ai/investigations/${id}/run`);
    return response.data;
  },

  cancelInvestigation: async (id: string): Promise<AiInvestigation> => {
    const response = await client.post<AiInvestigation>(`/api/v1/ai/investigations/${id}/cancel`);
    return response.data;
  },

  getEvidenceReferences: async (id: string): Promise<AiEvidenceReference[]> => {
    const response = await client.get<AiEvidenceReference[]>(`/api/v1/ai/investigations/${id}/evidence`);
    return response.data;
  },

  getKnowledgeReferences: async (id: string): Promise<AiKnowledgeReference[]> => {
    const response = await client.get<AiKnowledgeReference[]>(`/api/v1/ai/investigations/${id}/knowledge`);
    return response.data;
  },

  getClaims: async (id: string): Promise<AiAnalysisClaim[]> => {
    const response = await client.get<AiAnalysisClaim[]>(`/api/v1/ai/investigations/${id}/claims`);
    return response.data;
  },

  askQuestion: async (id: string, question: string): Promise<AiQuestionResponse> => {
    const req: AiQuestionRequest = { question };
    const response = await client.post<AiQuestionResponse>(`/api/v1/ai/investigations/${id}/questions`, req);
    return response.data;
  },
};
