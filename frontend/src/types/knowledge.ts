export interface KnowledgeDocument {
  id: number;
  uuid: string;
  title: string;
  source: string;
  sourceUrl?: string;
  documentType: string;
  version?: string;
  publishedAt?: string;
  retrievedAt?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'INVALID';
  content: string;
  contentHash: string;
  chunkCount: number;
  createdAt: string;
}

export interface KnowledgeIngestRequest {
  title: string;
  source: string;
  sourceUrl?: string;
  documentType: string;
  version?: string;
  content: string;
}

export interface KnowledgeSearchResult {
  documentId: number;
  documentUuid: string;
  title: string;
  source: string;
  sourceUrl?: string;
  documentType: string;
  chunkId: number;
  chunkUuid: string;
  contentExcerpt: string;
  relevanceScore: number;
}
