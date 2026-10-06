import client from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import {
  Assessment,
  AssessmentProfile,
  AssessmentStatus,
  AssessmentAssetItem,
  AssessmentEndpointItem,
  AssessmentObservationItem,
  CreateAssessmentRequest,
  ToolExecution,
} from '../../types/assessment';

export const assessmentApi = {
  getProfiles: async (): Promise<ApiResponse<AssessmentProfile[]>> => {
    const response = await client.get<ApiResponse<AssessmentProfile[]>>('/api/v1/assessment-profiles');
    return response.data;
  },

  createAssessment: async (request: CreateAssessmentRequest): Promise<ApiResponse<Assessment>> => {
    const response = await client.post<ApiResponse<Assessment>>('/api/v1/assessments', request);
    return response.data;
  },

  startAssessment: async (id: string): Promise<ApiResponse<Assessment>> => {
    const response = await client.post<ApiResponse<Assessment>>(`/api/v1/assessments/${id}/start`);
    return response.data;
  },

  getAssessments: async (page = 0, size = 20, targetId?: string, status?: AssessmentStatus): Promise<ApiResponse<PageResponse<Assessment>>> => {
    const params: Record<string, any> = { page, size };
    if (targetId) params.targetId = targetId;
    if (status) params.status = status;
    const response = await client.get<ApiResponse<PageResponse<Assessment>>>('/api/v1/assessments', { params });
    return response.data;
  },

  getAssessmentById: async (id: string): Promise<ApiResponse<Assessment>> => {
    const response = await client.get<ApiResponse<Assessment>>(`/api/v1/assessments/${id}`);
    return response.data;
  },

  getAssessmentStatus: async (id: string): Promise<ApiResponse<Assessment>> => {
    const response = await client.get<ApiResponse<Assessment>>(`/api/v1/assessments/${id}/status`);
    return response.data;
  },

  getToolExecutions: async (id: string, page = 0, size = 50): Promise<ApiResponse<PageResponse<ToolExecution>>> => {
    const response = await client.get<ApiResponse<PageResponse<ToolExecution>>>(`/api/v1/assessments/${id}/executions`, {
      params: { page, size }
    });
    return response.data;
  },

  getAssets: async (id: string, page = 0, size = 50): Promise<ApiResponse<PageResponse<AssessmentAssetItem>>> => {
    const response = await client.get<ApiResponse<PageResponse<AssessmentAssetItem>>>(`/api/v1/assessments/${id}/assets`, {
      params: { page, size }
    });
    return response.data;
  },

  getEndpoints: async (id: string, page = 0, size = 50): Promise<ApiResponse<PageResponse<AssessmentEndpointItem>>> => {
    const response = await client.get<ApiResponse<PageResponse<AssessmentEndpointItem>>>(`/api/v1/assessments/${id}/endpoints`, {
      params: { page, size }
    });
    return response.data;
  },

  getObservations: async (id: string, page = 0, size = 50): Promise<ApiResponse<PageResponse<AssessmentObservationItem>>> => {
    const response = await client.get<ApiResponse<PageResponse<AssessmentObservationItem>>>(`/api/v1/assessments/${id}/observations`, {
      params: { page, size }
    });
    return response.data;
  },

  cancelAssessment: async (id: string): Promise<ApiResponse<Assessment>> => {
    const response = await client.post<ApiResponse<Assessment>>(`/api/v1/assessments/${id}/cancel`);
    return response.data;
  },

  retryFailedStage: async (id: string, stage?: string): Promise<ApiResponse<Assessment>> => {
    const params = stage ? { stage } : {};
    const response = await client.post<ApiResponse<Assessment>>(`/api/v1/assessments/${id}/retry-failed-stage`, null, { params });
    return response.data;
  }
};
