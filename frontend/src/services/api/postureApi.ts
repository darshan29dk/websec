import { client } from './client';
import {
  SecurityPostureSnapshotDto,
  SecurityPostureDimensionDto,
  PostureScoreFactorDto,
  PostureTrendPointDto,
  AssessmentComparisonDto,
  SecurityRegressionDto,
  RegressionSummaryDto,
} from '../../types/posture';

export const postureApi = {
  getCurrentPosture: async (targetId: string): Promise<SecurityPostureSnapshotDto> => {
    return client.get<SecurityPostureSnapshotDto>(`/targets/${targetId}/posture/current`);
  },

  getPostureHistory: async (targetId: string): Promise<SecurityPostureSnapshotDto[]> => {
    return client.get<SecurityPostureSnapshotDto[]>(`/targets/${targetId}/posture/history`);
  },

  getPostureDimensions: async (targetId: string): Promise<SecurityPostureDimensionDto[]> => {
    return client.get<SecurityPostureDimensionDto[]>(`/targets/${targetId}/posture/dimensions`);
  },

  getPostureFactors: async (targetId: string): Promise<PostureScoreFactorDto[]> => {
    return client.get<PostureScoreFactorDto[]>(`/targets/${targetId}/posture/factors`);
  },

  getPostureTrends: async (targetId: string): Promise<PostureTrendPointDto[]> => {
    return client.get<PostureTrendPointDto[]>(`/targets/${targetId}/posture/trends`);
  },

  recalculatePosture: async (targetId: string): Promise<SecurityPostureSnapshotDto> => {
    return client.post<SecurityPostureSnapshotDto>(`/targets/${targetId}/posture/recalculate`);
  },

  compareAssessments: async (
    targetId: string,
    currentAssessmentId: string,
    previousAssessmentId?: string
  ): Promise<AssessmentComparisonDto> => {
    return client.get<AssessmentComparisonDto>(`/targets/${targetId}/assessments/compare`, {
      params: { currentAssessmentId, previousAssessmentId },
    });
  },

  getRegressions: async (
    targetId: string,
    type?: string,
    confidence?: string,
    status?: string
  ): Promise<SecurityRegressionDto[]> => {
    return client.get<SecurityRegressionDto[]>(`/targets/${targetId}/regressions`, {
      params: { type, confidence, status },
    });
  },

  getRegressionDetails: async (
    targetId: string,
    regressionId: string
  ): Promise<SecurityRegressionDto> => {
    return client.get<SecurityRegressionDto>(`/targets/${targetId}/regressions/${regressionId}`);
  },

  getRegressionSummary: async (targetId: string): Promise<RegressionSummaryDto> => {
    return client.get<RegressionSummaryDto>(`/targets/${targetId}/regression-summary`);
  },
};
