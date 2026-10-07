import { client } from './client';
import {
  Retest,
  RetestCheck,
  RetestEvidence,
  DefenseValidation,
  RemediationStatusHistory,
  RetestDashboardMetrics,
} from '../../types/retest';

export const retestApi = {
  createRetest: async (findingId: string, reason?: string): Promise<Retest> => {
    return client.post<Retest>(`/findings/${findingId}/retests`, {
      reason,
      authorizationConfirmed: true,
    });
  },

  listRetestsForFinding: async (findingId: string): Promise<Retest[]> => {
    return client.get<Retest[]>(`/findings/${findingId}/retests`);
  },

  getRetestById: async (id: string): Promise<Retest> => {
    return client.get<Retest>(`/retests/${id}`);
  },

  startRetest: async (id: string): Promise<Retest> => {
    return client.post<Retest>(`/retests/${id}/start`);
  },

  cancelRetest: async (id: string): Promise<Retest> => {
    return client.post<Retest>(`/retests/${id}/cancel`);
  },

  getRetestChecks: async (id: string): Promise<RetestCheck[]> => {
    return client.get<RetestCheck[]>(`/retests/${id}/checks`);
  },

  getRetestEvidence: async (id: string): Promise<RetestEvidence[]> => {
    return client.get<RetestEvidence[]>(`/retests/${id}/evidence`);
  },

  getRetestValidation: async (id: string): Promise<DefenseValidation> => {
    return client.get<DefenseValidation>(`/retests/${id}/validation`);
  },

  getFindingValidationHistory: async (findingId: string): Promise<RemediationStatusHistory[]> => {
    return client.get<RemediationStatusHistory[]>(`/findings/${findingId}/validation-history`);
  },

  getDashboardMetrics: async (): Promise<RetestDashboardMetrics> => {
    return client.get<RetestDashboardMetrics>('/retests/dashboard');
  },
};
