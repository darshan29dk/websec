import client from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import {
  AttackSurfaceSummary,
  AttackSurfaceAsset,
  AttackSurfaceRelationship,
  Technology,
  WebEndpoint,
  AssetType,
} from '../../types/attackSurface';

export const attackSurfaceApi = {
  getSummary: async (assessmentId: string): Promise<AttackSurfaceSummary> => {
    return client.get<AttackSurfaceSummary>(`/assessments/${assessmentId}/attack-surface/summary`);
  },

  getAssets: async (assessmentId: string, type?: AssetType, page = 0, size = 50): Promise<PageResponse<AttackSurfaceAsset>> => {
    const params: Record<string, any> = { page, size };
    if (type) params.type = type;
    return client.get<PageResponse<AttackSurfaceAsset>>(`/assessments/${assessmentId}/attack-surface/assets`, { params });
  },

  getRelationships: async (assessmentId: string, page = 0, size = 50): Promise<PageResponse<AttackSurfaceRelationship>> => {
    return client.get<PageResponse<AttackSurfaceRelationship>>(`/assessments/${assessmentId}/attack-surface/relationships`, {
      params: { page, size }
    });
  },

  getTechnologies: async (assessmentId: string, page = 0, size = 50): Promise<PageResponse<Technology>> => {
    return client.get<PageResponse<Technology>>(`/assessments/${assessmentId}/attack-surface/technologies`, {
      params: { page, size }
    });
  },

  getEndpoints: async (assessmentId: string, page = 0, size = 50): Promise<PageResponse<WebEndpoint>> => {
    return client.get<PageResponse<WebEndpoint>>(`/assessments/${assessmentId}/attack-surface/endpoints`, {
      params: { page, size }
    });
  }
};
