import { ApiClient } from './client';

export interface HealthData {
  status: 'UP' | 'DOWN';
  applicationName: string;
  version: string;
  timestamp: string;
  components: {
    database?: { status: string; databaseProduct?: string; error?: string };
    migrations?: { status: string; currentVersion?: string; appliedCount?: number; error?: string };
    [key: string]: any;
  };
}

export const healthApi = {
  getHealth: (): Promise<HealthData> => {
    return ApiClient.get<HealthData>('/health');
  },
};
