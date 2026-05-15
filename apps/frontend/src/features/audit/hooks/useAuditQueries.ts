import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLogListParams } from '@/services/auditService';

export const auditKeys = {
  all: ['audit'] as const,
  list: (params: AuditLogListParams) => [...auditKeys.all, params] as const,
};

export const useAuditLogs = (params: AuditLogListParams) =>
  useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditService.list(params),
    placeholderData: (previousData) => previousData,
  });
