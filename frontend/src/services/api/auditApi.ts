import { ApiClient } from './client';
import { PageResponse } from '../../types/common';
import { AuditEvent, AuditFilterParams } from '../../types/audit';

export const auditApi = {
  getAuditEvents: (params: AuditFilterParams = {}): Promise<PageResponse<AuditEvent>> => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.user) queryParams.append('user', params.user);
    if (params.eventType) queryParams.append('eventType', params.eventType);
    if (params.resourceType) queryParams.append('resourceType', params.resourceType);
    if (params.search) queryParams.append('search', params.search);

    return ApiClient.get<PageResponse<AuditEvent>>(`/audit?${queryParams.toString()}`);
  },
};
