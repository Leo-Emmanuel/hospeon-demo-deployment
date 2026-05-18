import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { visitService, VisitListParams, VisitStatus } from '@/services/visitService';

import { QK } from '@/lib/queryKeys';

export const useVisits = (params: VisitListParams) =>
  useQuery({
    queryKey: QK.visits.list(params),
    queryFn: () => visitService.list(params),
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });

export const useVisit = (id: string) =>
  useQuery({
    queryKey: QK.visits.detail(id),
    queryFn: () => visitService.getById(id),
    enabled: Boolean(id),
  });

export const useUpdateVisitStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VisitStatus }) => visitService.updateStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QK.visits.all() });
      queryClient.invalidateQueries({ queryKey: QK.visits.today() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.opdQueue() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.summary() });
      queryClient.setQueryData(QK.visits.detail(response.data.id), response);
    },
  });
};

export const useCreateVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof visitService.create>[0]) => visitService.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QK.visits.all() });
      queryClient.invalidateQueries({ queryKey: QK.visits.today() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.opdQueue() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.summary() });
      queryClient.invalidateQueries({ queryKey: QK.patients.detail(variables.patientId) });
      queryClient.invalidateQueries({ queryKey: QK.patients.visits(variables.patientId) });
    },
  });
};
