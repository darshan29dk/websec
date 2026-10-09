import { ApiClient } from './client';

export type ToolCategory =
  | 'RECONNAISSANCE'
  | 'WEB_SECURITY'
  | 'NETWORK_SECURITY'
  | 'BLUE_TEAM_SIEM'
  | 'DIGITAL_FORENSICS';

export type ToolIntegrationType =
  | 'EXECUTABLE_SCANNER'
  | 'PACKET_ANALYSIS'
  | 'TELEMETRY_SOURCE'
  | 'IDS_ENGINE'
  | 'SIEM_CONNECTOR'
  | 'FORENSICS_TOOL'
  | 'REVERSE_ENGINEERING_TOOL'
  | 'EXTERNAL_API'
  | 'MANAGED_SECURITY_PLATFORM';

export interface SecurityToolStatus {
  id?: string;
  toolName: string;
  displayName?: string;
  category: ToolCategory;
  integrationType: ToolIntegrationType;
  description?: string;
  version?: string;
  executablePath?: string;
  status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_CONFIGURED' | 'DISABLED' | 'FAILED';
  supportedOperations?: string;
  configurationStatus?: string;
  authorizationRequired: boolean;
  enabled: boolean;
  lastCheckedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const toolsApi = {
  getAllTools: (): Promise<SecurityToolStatus[]> => {
    return ApiClient.get<SecurityToolStatus[]>('/security-tools');
  },

  getToolByName: (toolName: string): Promise<SecurityToolStatus> => {
    return ApiClient.get<SecurityToolStatus>(`/security-tools/${encodeURIComponent(toolName)}`);
  },

  checkToolHealth: (toolName: string): Promise<SecurityToolStatus> => {
    return ApiClient.get<SecurityToolStatus>(`/security-tools/${encodeURIComponent(toolName)}/health`);
  },

  recheckAllTools: (): Promise<SecurityToolStatus[]> => {
    return ApiClient.post<SecurityToolStatus[]>('/security-tools/check-all');
  },
};
