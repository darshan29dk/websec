import { client } from './client';
import {
  CreateMonitoringRequestDto,
  MonitoringConfigurationDto,
} from '../../types/monitoring';

export const monitoringApi = {
  createConfiguration: async (dto: CreateMonitoringRequestDto): Promise<MonitoringConfigurationDto> => {
    return client.post<MonitoringConfigurationDto>('/monitoring', dto);
  },

  getAllConfigurations: async (): Promise<MonitoringConfigurationDto[]> => {
    return client.get<MonitoringConfigurationDto[]>('/monitoring');
  },

  getConfigurationByTarget: async (targetId: string): Promise<MonitoringConfigurationDto> => {
    return client.get<MonitoringConfigurationDto>(`/monitoring/target/${targetId}`);
  },

  enableConfiguration: async (id: string): Promise<MonitoringConfigurationDto> => {
    return client.post<MonitoringConfigurationDto>(`/monitoring/${id}/enable`);
  },

  disableConfiguration: async (id: string): Promise<MonitoringConfigurationDto> => {
    return client.post<MonitoringConfigurationDto>(`/monitoring/${id}/disable`);
  },
};
