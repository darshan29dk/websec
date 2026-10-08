import client from './client';
import { PageResponse } from '../../types/common';
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
  getProfiles: async (): Promise<AssessmentProfile[]> => {
    return client.get<AssessmentProfile[]>('/api/v1/assessment-profiles');
  },

  createAssessment: async (request: CreateAssessmentRequest): Promise<Assessment> => {
    return client.post<Assessment>('/api/v1/assessments', request);
  },

  startAssessment: async (id: string): Promise<Assessment> => {
    return client.post<Assessment>(`/api/v1/assessments/${id}/start`);
  },

  getAssessments: async (page = 0, size = 20, targetId?: string, status?: AssessmentStatus): Promise<PageResponse<Assessment>> => {
    const params: Record<string, any> = { page, size };
    if (targetId) params.targetId = targetId;
    if (status) params.status = status;
    return client.get<PageResponse<Assessment>>('/api/v1/assessments', { params });
  },

  listAssessments: async (targetId?: string): Promise<PageResponse<Assessment>> => {
    return assessmentApi.getAssessments(0, 100, targetId);
  },

  getAssessmentById: async (id: string): Promise<Assessment> => {
    return client.get<Assessment>(`/api/v1/assessments/${id}`);
  },

  getAssessmentStatus: async (id: string): Promise<Assessment> => {
    return client.get<Assessment>(`/api/v1/assessments/${id}/status`);
  },

  getToolExecutions: async (id: string, page = 0, size = 50): Promise<PageResponse<ToolExecution>> => {
    return client.get<PageResponse<ToolExecution>>(`/api/v1/assessments/${id}/executions`, {
      params: { page, size }
    });
  },

  getAssets: async (id: string, page = 0, size = 50): Promise<PageResponse<AssessmentAssetItem>> => {
    return client.get<PageResponse<AssessmentAssetItem>>(`/api/v1/assessments/${id}/assets`, {
      params: { page, size }
    });
  },

  getEndpoints: async (id: string, page = 0, size = 50): Promise<PageResponse<AssessmentEndpointItem>> => {
    return client.get<PageResponse<AssessmentEndpointItem>>(`/api/v1/assessments/${id}/endpoints`, {
      params: { page, size }
    });
  },

  getObservations: async (id: string, page = 0, size = 50): Promise<PageResponse<AssessmentObservationItem>> => {
    return client.get<PageResponse<AssessmentObservationItem>>(`/api/v1/assessments/${id}/observations`, {
      params: { page, size }
    });
  },

  cancelAssessment: async (id: string): Promise<Assessment> => {
    return client.post<Assessment>(`/api/v1/assessments/${id}/cancel`);
  },

  retryFailedStage: async (id: string, stage?: string): Promise<Assessment> => {
    const params = stage ? { stage } : {};
    return client.post<Assessment>(`/api/v1/assessments/${id}/retry-failed-stage`, null, { params });
  }
};
