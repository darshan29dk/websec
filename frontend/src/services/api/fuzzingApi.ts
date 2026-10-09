import client from './client';
import { PageResponse } from '../../types/common';
import {
  FuzzingCampaign,
  FuzzingTestCase,
  FuzzingExecutionRecord,
  FuzzingCoverageResult,
  CreateFuzzingCampaignRequest,
  ReproduceTestCaseRequest,
  ReproduceTestCaseResponse,
  LinkFindingRequest,
  TestResultClassification,
} from '../../types/fuzzing';

export const fuzzingApi = {
  createCampaign: async (request: CreateFuzzingCampaignRequest): Promise<FuzzingCampaign> => {
    return client.post<FuzzingCampaign>('/api/v1/fuzzing/campaigns', request);
  },

  getCampaigns: async (targetId?: string): Promise<FuzzingCampaign[]> => {
    const params: Record<string, any> = {};
    if (targetId) params.targetId = targetId;
    return client.get<FuzzingCampaign[]>('/api/v1/fuzzing/campaigns', { params });
  },

  getCampaignById: async (id: string): Promise<FuzzingCampaign> => {
    return client.get<FuzzingCampaign>(`/api/v1/fuzzing/campaigns/${id}`);
  },

  startCampaign: async (id: string): Promise<void> => {
    return client.post<void>(`/api/v1/fuzzing/campaigns/${id}/start`);
  },

  cancelCampaign: async (id: string): Promise<FuzzingCampaign> => {
    return client.post<FuzzingCampaign>(`/api/v1/fuzzing/campaigns/${id}/cancel`);
  },

  getTestCases: async (
    campaignId: string,
    page = 0,
    size = 50
  ): Promise<PageResponse<FuzzingTestCase>> => {
    return client.get<PageResponse<FuzzingTestCase>>(
      `/api/v1/fuzzing/campaigns/${campaignId}/test-cases`,
      { params: { page, size } }
    );
  },

  getExecutionRecords: async (
    campaignId: string,
    classification?: TestResultClassification,
    page = 0,
    size = 50
  ): Promise<PageResponse<FuzzingExecutionRecord>> => {
    const params: Record<string, any> = { page, size };
    if (classification) params.classification = classification;
    return client.get<PageResponse<FuzzingExecutionRecord>>(
      `/api/v1/fuzzing/campaigns/${campaignId}/executions`,
      { params }
    );
  },

  getCoverage: async (campaignId: string): Promise<FuzzingCoverageResult[]> => {
    return client.get<FuzzingCoverageResult[]>(
      `/api/v1/fuzzing/campaigns/${campaignId}/coverage`
    );
  },

  reproduceTestCase: async (
    request: ReproduceTestCaseRequest
  ): Promise<ReproduceTestCaseResponse> => {
    return client.post<ReproduceTestCaseResponse>('/api/v1/fuzzing/reproduce', request);
  },

  linkFinding: async (request: LinkFindingRequest): Promise<void> => {
    return client.post<void>('/api/v1/fuzzing/link-finding', request);
  },
};
