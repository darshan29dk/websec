import client from './client';
import {
  KnowledgeDocument,
  KnowledgeIngestRequest,
  KnowledgeSearchResult,
} from '../../types/knowledge';

export const knowledgeApi = {
  getAllDocuments: async (): Promise<KnowledgeDocument[]> => {
    const response = await client.get<KnowledgeDocument[]>('/api/v1/knowledge/documents');
    return response.data;
  },

  getDocumentById: async (id: string): Promise<KnowledgeDocument> => {
    const response = await client.get<KnowledgeDocument>(`/api/v1/knowledge/documents/${id}`);
    return response.data;
  },

  createDocument: async (request: KnowledgeIngestRequest): Promise<KnowledgeDocument> => {
    const response = await client.post<KnowledgeDocument>('/api/v1/knowledge/documents', request);
    return response.data;
  },

  ingestDocument: async (request: KnowledgeIngestRequest): Promise<KnowledgeDocument> => {
    const response = await client.post<KnowledgeDocument>('/api/v1/knowledge/ingest', request);
    return response.data;
  },

  searchKnowledge: async (query?: string, source?: string, documentType?: string, limit = 10): Promise<KnowledgeSearchResult[]> => {
    const params: Record<string, any> = { limit };
    if (query) params.query = query;
    if (source) params.source = source;
    if (documentType) params.documentType = documentType;

    const response = await client.get<KnowledgeSearchResult[]>('/api/v1/knowledge/search', { params });
    return response.data;
  },
};
