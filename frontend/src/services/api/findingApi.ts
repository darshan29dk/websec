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
  ): Promise<PageResponse<SecurityFinding>> => {
    const params: Record<string, any> = { page, size };
    if (assessmentId) params.assessmentId = assessmentId;
    if (severity) params.severity = severity;
    if (status) params.status = status;
    if (confidence) params.confidence = confidence;
    if (source) params.source = source;
    if (search) params.search = search;

    return client.get<PageResponse<SecurityFinding>>('/findings', { params });
  },

  getFindingById: async (id: string): Promise<FindingDetail> => {
    return client.get<FindingDetail>(`/findings/${id}`);
  },

  updateStatus: async (id: string, newStatus: FindingStatus, comment?: string): Promise<SecurityFinding> => {
    return client.post<SecurityFinding>(`/findings/${id}/status`, {
      newStatus,
      comment
    });
  },

  addComment: async (id: string, comment: string): Promise<FindingComment> => {
    return client.post<FindingComment>(`/findings/${id}/comments`, { comment });
  },

  getAssessmentFindingsSummary: async (assessmentId: string): Promise<FindingSummary> => {
    return client.get<FindingSummary>(`/assessments/${assessmentId}/findings/summary`);
  }
};
