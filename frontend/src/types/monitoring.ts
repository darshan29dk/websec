export type MonitoringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export type MonitoringStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'BLOCKED_AUTHORIZATION_EXPIRED';

export interface CreateMonitoringRequestDto {
  targetId: string;
  profileId?: string;
  frequency: MonitoringFrequency;
}

export interface MonitoringConfigurationDto {
  id: string;
  uuid: string;
  targetId: string;
  targetName: string;
  targetUrl: string;
  profileId?: string;
  profileName?: string;
  frequency: MonitoringFrequency;
  enabled: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  lastStatus: MonitoringStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
