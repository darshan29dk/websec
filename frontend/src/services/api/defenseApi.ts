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
    return api.get<DefenseOverviewMetrics>('/defense/overview');
  },

  listRecommendations: async (status?: string, priority?: string): Promise<DefenseRecommendation[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (priority) params.priority = priority;
    return api.get<DefenseRecommendation[]>('/defense/recommendations', { params });
  },

  getRecommendation: async (id: string): Promise<DefenseRecommendation> => {
    return api.get<DefenseRecommendation>(`/defense/recommendations/${id}`);
  },

  generateRecommendation: async (findingId: string, useAiAnalysis = true): Promise<DefenseRecommendation> => {
    return api.post<DefenseRecommendation>('/defense/recommendations/generate', {
      findingId,
      useAiAnalysis,
    });
  },

  reviewRecommendation: async (id: string, action: 'APPROVE' | 'REJECT', reviewNotes?: string): Promise<DefenseRecommendation> => {
    return api.post<DefenseRecommendation>(`/defense/recommendations/${id}/review`, {
      action,
      reviewNotes,
    });
  },

  updateRecommendationStatus: async (id: string, status: string): Promise<DefenseRecommendation> => {
    return api.put<DefenseRecommendation>(`/defense/recommendations/${id}/status`, {
      status,
    });
  },

  listControls: async (category?: string): Promise<DefenseControl[]> => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    return api.get<DefenseControl[]>('/defense/controls', { params });
  },

  getControl: async (id: string): Promise<DefenseControl> => {
    return api.get<DefenseControl>(`/defense/controls/${id}`);
  },

  listRemediationPlans: async (status?: string): Promise<RemediationPlan[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    return api.get<RemediationPlan[]>('/remediation/plans', { params });
  },

  getRemediationPlan: async (id: string): Promise<RemediationPlan> => {
    return api.get<RemediationPlan>(`/remediation/plans/${id}`);
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
    return api.post<RemediationPlan>('/remediation/plans', data);
  },

  addRemediationTask: async (planId: string, data: {
    title: string;
    description?: string;
    taskType?: string;
    sequence?: number;
    owner?: string;
  }): Promise<RemediationTask> => {
    return api.post<RemediationTask>(`/remediation/plans/${planId}/tasks`, data);
  },

  updateTaskStatus: async (taskId: string, status: string): Promise<RemediationTask> => {
    return api.put<RemediationTask>(`/remediation/tasks/${taskId}`, { status });
  },
};
