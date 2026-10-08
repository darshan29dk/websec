import client from './client';
import {
  KnowledgeDocument,
  KnowledgeIngestRequest,
  KnowledgeSearchResult,
} from '../../types/knowledge';

export const knowledgeApi = {
  getAllDocuments: async (): Promise<KnowledgeDocument[]> => {
    return client.get<KnowledgeDocument[]>('/knowledge/documents');
  },

  getDocumentById: async (id: string): Promise<KnowledgeDocument> => {
    return client.get<KnowledgeDocument>(`/knowledge/documents/${id}`);
  },

  createDocument: async (request: KnowledgeIngestRequest): Promise<KnowledgeDocument> => {
    return client.post<KnowledgeDocument>('/knowledge/documents', request);
  },

  ingestDocument: async (request: KnowledgeIngestRequest): Promise<KnowledgeDocument> => {
    return client.post<KnowledgeDocument>('/knowledge/ingest', request);
  },

  searchKnowledge: async (query?: string, source?: string, documentType?: string, limit = 10): Promise<KnowledgeSearchResult[]> => {
    const params: Record<string, any> = { limit };
    if (query) params.query = query;
    if (source) params.source = source;
    if (documentType) params.documentType = documentType;

    return client.get<KnowledgeSearchResult[]>('/knowledge/search', { params });
  },
};
