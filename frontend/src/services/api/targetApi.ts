import { ApiClient } from './client';
import { PageResponse } from '../../types/common';
import {
  Target,
  TargetAuthorization,
  TargetAuthorizationRequest,
  TargetRequest,
  TargetScope,
  TargetScopeRequest,
  TargetStatus,
} from '../../types/target';

export const targetApi = {
  createTarget: (request: TargetRequest): Promise<Target> => {
    return ApiClient.post<Target>('/targets', request);
  },

  getTargets: (
    page = 0,
    size = 20,
    status?: TargetStatus,
    search?: string
  ): Promise<PageResponse<Target>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    return ApiClient.get<PageResponse<Target>>(`/targets?${params.toString()}`);
  },

  getTargetById: (id: string): Promise<Target> => {
    return ApiClient.get<Target>(`/targets/${id}`);
  },

  updateTarget: (id: string, request: TargetRequest): Promise<Target> => {
    return ApiClient.put<Target>(`/targets/${id}`, request);
  },

  disableTarget: (id: string): Promise<Target> => {
    return ApiClient.delete<Target>(`/targets/${id}`);
  },

  addAuthorization: (
    targetId: string,
    request: TargetAuthorizationRequest
  ): Promise<TargetAuthorization> => {
    return ApiClient.post<TargetAuthorization>(
      `/targets/${targetId}/authorization`,
      request
    );
  },

  getAuthorizations: (targetId: string): Promise<TargetAuthorization[]> => {
    return ApiClient.get<TargetAuthorization[]>(
      `/targets/${targetId}/authorization`
    );
  },

  addScope: (
    targetId: string,
    request: TargetScopeRequest
  ): Promise<TargetScope> => {
    return ApiClient.post<TargetScope>(`/targets/${targetId}/scope`, request);
  },

  getScopes: (targetId: string): Promise<TargetScope[]> => {
    return ApiClient.get<TargetScope[]>(`/targets/${targetId}/scope`);
  },
};
