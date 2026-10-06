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
  getSummary: async (assessmentId: string): Promise<ApiResponse<AttackSurfaceSummary>> => {
    const response = await client.get<ApiResponse<AttackSurfaceSummary>>(`/api/v1/assessments/${assessmentId}/attack-surface/summary`);
    return response.data;
  },

  getAssets: async (assessmentId: string, type?: AssetType, page = 0, size = 50): Promise<ApiResponse<PageResponse<AttackSurfaceAsset>>> => {
    const params: Record<string, any> = { page, size };
    if (type) params.type = type;
    const response = await client.get<ApiResponse<PageResponse<AttackSurfaceAsset>>>(`/api/v1/assessments/${assessmentId}/attack-surface/assets`, { params });
    return response.data;
  },

  getRelationships: async (assessmentId: string, page = 0, size = 50): Promise<ApiResponse<PageResponse<AttackSurfaceRelationship>>> => {
    const response = await client.get<ApiResponse<PageResponse<AttackSurfaceRelationship>>>(`/api/v1/assessments/${assessmentId}/attack-surface/relationships`, {
      params: { page, size }
    });
    return response.data;
  },

  getTechnologies: async (assessmentId: string, page = 0, size = 50): Promise<ApiResponse<PageResponse<Technology>>> => {
    const response = await client.get<ApiResponse<PageResponse<Technology>>>(`/api/v1/assessments/${assessmentId}/attack-surface/technologies`, {
      params: { page, size }
    });
    return response.data;
  },

  getEndpoints: async (assessmentId: string, page = 0, size = 50): Promise<ApiResponse<PageResponse<WebEndpoint>>> => {
    const response = await client.get<ApiResponse<PageResponse<WebEndpoint>>>(`/api/v1/assessments/${assessmentId}/attack-surface/endpoints`, {
      params: { page, size }
    });
    return response.data;
  }
};
