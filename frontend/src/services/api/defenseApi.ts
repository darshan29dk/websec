import api from './client';
import {
  DefenseRecommendation,
  DefenseControl,
  RemediationPlan,
  RemediationTask,
  DefenseOverviewMetrics,
} from '../../types/defense';

export const defenseApi = {
  getOverviewMetrics: async (): Promise<DefenseOverviewMetrics> => {
    const res = await api.get<DefenseOverviewMetrics>('/api/v1/defense/overview');
    return res.data;
  },

  listRecommendations: async (status?: string, priority?: string): Promise<DefenseRecommendation[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (priority) params.priority = priority;
    const res = await api.get<DefenseRecommendation[]>('/api/v1/defense/recommendations', { params });
    return res.data;
  },

  getRecommendation: async (id: string): Promise<DefenseRecommendation> => {
    const res = await api.get<DefenseRecommendation>(`/api/v1/defense/recommendations/${id}`);
    return res.data;
  },

  generateRecommendation: async (findingId: string, useAiAnalysis = true): Promise<DefenseRecommendation> => {
    const res = await api.post<DefenseRecommendation>('/api/v1/defense/recommendations/generate', {
      findingId,
      useAiAnalysis,
    });
    return res.data;
  },

  reviewRecommendation: async (id: string, action: 'APPROVE' | 'REJECT', reviewNotes?: string): Promise<DefenseRecommendation> => {
    const res = await api.post<DefenseRecommendation>(`/api/v1/defense/recommendations/${id}/review`, {
      action,
      reviewNotes,
    });
    return res.data;
  },

  updateRecommendationStatus: async (id: string, status: string): Promise<DefenseRecommendation> => {
    const res = await api.put<DefenseRecommendation>(`/api/v1/defense/recommendations/${id}/status`, {
      status,
    });
    return res.data;
  },

  listControls: async (category?: string): Promise<DefenseControl[]> => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    const res = await api.get<DefenseControl[]>('/api/v1/defense/controls', { params });
    return res.data;
  },

  getControl: async (id: string): Promise<DefenseControl> => {
    const res = await api.get<DefenseControl>(`/api/v1/defense/controls/${id}`);
    return res.data;
  },

  listRemediationPlans: async (status?: string): Promise<RemediationPlan[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const res = await api.get<RemediationPlan[]>('/api/v1/remediation/plans', { params });
    return res.data;
  },

  getRemediationPlan: async (id: string): Promise<RemediationPlan> => {
    const res = await api.get<RemediationPlan>(`/api/v1/remediation/plans/${id}`);
    return res.data;
  },

  createRemediationPlan: async (data: {
    findingId?: string;
    recommendationId?: string;
    title: string;
    description?: string;
    priority?: string;
    owner?: string;
    targetDate?: string;
  }): Promise<RemediationPlan> => {
    const res = await api.post<RemediationPlan>('/api/v1/remediation/plans', data);
    return res.data;
  },

  addRemediationTask: async (planId: string, data: {
    title: string;
    description?: string;
    taskType?: string;
    sequence?: number;
    owner?: string;
  }): Promise<RemediationTask> => {
    const res = await api.post<RemediationTask>(`/api/v1/remediation/plans/${planId}/tasks`, data);
    return res.data;
  },

  updateTaskStatus: async (taskId: string, status: string): Promise<RemediationTask> => {
    const res = await api.put<RemediationTask>(`/api/v1/remediation/tasks/${taskId}`, { status });
    return res.data;
  },
};
