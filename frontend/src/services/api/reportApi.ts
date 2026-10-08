import { client } from './client';
import {
  CreateReportRequestDto,
  SecurityReportDto,
  ReportType,
  ReportStatus,
  ReportFormat,
} from '../../types/report';
import { PageResponse } from '../../types/common';

export const reportApi = {
  createReport: async (dto: CreateReportRequestDto): Promise<SecurityReportDto> => {
    return client.post<SecurityReportDto>('/reports', dto);
  },

  searchReports: async (
    targetId?: string,
    reportType?: ReportType,
    status?: ReportStatus,
    format?: ReportFormat,
    page = 0,
    size = 20
  ): Promise<PageResponse<SecurityReportDto>> => {
    return client.get<PageResponse<SecurityReportDto>>('/reports', {
      params: { targetId, reportType, status, format, page, size },
    });
  },

  getReportById: async (id: string): Promise<SecurityReportDto> => {
    return client.get<SecurityReportDto>(`/reports/${id}`);
  },

  getReportStatus: async (id: string): Promise<ReportStatus> => {
    return client.get<ReportStatus>(`/reports/${id}/status`);
  },

  downloadReportBlob: async (id: string): Promise<{ blob: Blob; filename: string; checksum: string }> => {
    const res = await fetch(`/api/v1/reports/${id}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Report download failed with HTTP status ${res.status}`);
    }

    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = `report_${id.substring(0, 8)}`;
    if (disposition.includes('filename=')) {
      filename = disposition.split('filename=')[1].replace(/"/g, '');
    }

    const checksum = res.headers.get('X-Report-Checksum-SHA256') || '';
    const blob = await res.blob();
    return { blob, filename, checksum };
  },

  regenerateReport: async (id: string): Promise<SecurityReportDto> => {
    return client.post<SecurityReportDto>(`/reports/${id}/regenerate`);
  },

  deleteReport: async (id: string): Promise<void> => {
    return client.delete<void>(`/reports/${id}`);
  },
};
