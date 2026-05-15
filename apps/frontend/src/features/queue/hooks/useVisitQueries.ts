import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { visitService, VisitListParams, VisitStatus } from '@/services/visitService';

export const visitKeys = {
  all: ['visits'] as const,
  lists: () => [...visitKeys.all, 'list'] as const,
  list: (params: VisitListParams) => [...visitKeys.lists(), params] as const,
  details: () => [...visitKeys.all, 'detail'] as const,
  detail: (id: string) => [...visitKeys.details(), id] as const,
};

export const useVisits = (params: VisitListParams) =>
  useQuery({
    queryKey: visitKeys.list(params),
    queryFn: () => visitService.list(params),
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });

export const useVisit = (id: string) =>
  useQuery({
    queryKey: visitKeys.detail(id),
    queryFn: () => visitService.getById(id),
    enabled: Boolean(id),
  });

export const useUpdateVisitStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VisitStatus }) => visitService.updateStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.setQueryData(visitKeys.detail(response.data.id), response);
    },
  });
};
