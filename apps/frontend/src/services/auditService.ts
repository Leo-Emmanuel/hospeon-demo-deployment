import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/services/patientService';

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export interface AuditLogListParams {
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export const auditService = {
  list: async (params: AuditLogListParams = {}): Promise<ApiResponse<AuditLogRecord[]>> =>
    apiClient.get('/audit', { params }),
};
