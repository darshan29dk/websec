import { ApiClient } from './client';
import { GlobalDashboardOverview, GlobalDashboardCharts } from '../../types/dashboard';

export const dashboardApi = {
  getOverview: async (): Promise<GlobalDashboardOverview> => {
    return ApiClient.get<GlobalDashboardOverview>('/dashboard/overview');
  },

  getCharts: async (): Promise<GlobalDashboardCharts> => {
    return ApiClient.get<GlobalDashboardCharts>('/dashboard/charts');
  },
};
