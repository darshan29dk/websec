import client from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import {
  SecurityFinding,
  FindingDetail,
  FindingComment,
  FindingSummary,
  FindingSeverity,
  FindingStatus,
  FindingConfidence,
} from '../../types/finding';

export const findingApi = {
  getFindings: async (
    page = 0,
    size = 20,
    assessmentId?: string,
    severity?: FindingSeverity,
    status?: FindingStatus,
    confidence?: FindingConfidence,
    source?: string,
    search?: string
  ): Promise<ApiResponse<PageResponse<SecurityFinding>>> => {
    const params: Record<string, any> = { page, size };
    if (assessmentId) params.assessmentId = assessmentId;
    if (severity) params.severity = severity;
    if (status) params.status = status;
    if (confidence) params.confidence = confidence;
    if (source) params.source = source;
    if (search) params.search = search;

    const response = await client.get<ApiResponse<PageResponse<SecurityFinding>>>('/api/v1/findings', { params });
    return response.data;
  },

  getFindingById: async (id: string): Promise<ApiResponse<FindingDetail>> => {
    const response = await client.get<ApiResponse<FindingDetail>>(`/api/v1/findings/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, newStatus: FindingStatus, comment?: string): Promise<ApiResponse<SecurityFinding>> => {
    const response = await client.post<ApiResponse<SecurityFinding>>(`/api/v1/findings/${id}/status`, {
      newStatus,
      comment
    });
    return response.data;
  },

  addComment: async (id: string, comment: string): Promise<ApiResponse<FindingComment>> => {
    const response = await client.post<ApiResponse<FindingComment>>(`/api/v1/findings/${id}/comments`, { comment });
    return response.data;
  },

  getAssessmentFindingsSummary: async (assessmentId: string): Promise<ApiResponse<FindingSummary>> => {
    const response = await client.get<ApiResponse<FindingSummary>>(`/api/v1/assessments/${assessmentId}/findings/summary`);
    return response.data;
  }
};
