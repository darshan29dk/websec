import { client } from './client';
import { SecurityHistoryTimelineDto } from '../../types/history';

export const historyApi = {
  getTargetSecurityHistory: async (targetId: string): Promise<SecurityHistoryTimelineDto> => {
    return client.get<SecurityHistoryTimelineDto>(`/targets/${targetId}/security-history`);
  },
};
