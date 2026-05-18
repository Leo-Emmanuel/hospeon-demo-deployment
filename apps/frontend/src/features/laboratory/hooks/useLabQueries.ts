import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labService, LabOrderListParams, UpsertLabResultPayload } from '@/services/labService';
import { useToast } from '@/components/ui/Toast';

import { QK } from '@/lib/queryKeys';

export const labKeys = {
  catalog: () => ['lab', 'catalog'] as const,
  catalogList: (params: { showAll?: boolean }) => [...labKeys.catalog(), params] as const,
};

export const useLabOrders = (params: LabOrderListParams) =>
  useQuery({
    queryKey: QK.labOrders.list(params),
    queryFn: () => labService.listOrders(params),
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });

export const useLabOrder = (id: string) =>
  useQuery({
    queryKey: QK.labOrders.detail(id),
    queryFn: () => labService.getOrder(id),
    enabled: Boolean(id),
  });

export const useLabResult = (orderId: string) =>
  useQuery({
    queryKey: QK.labResults.detail(orderId),
    queryFn: () => labService.getResult(orderId),
    enabled: Boolean(orderId),
    retry: false,
  });

export const useUpdateLabOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTED' | 'APPROVED' | 'CANCELLED';
      notes?: string;
    }) => labService.updateOrderStatus(id, status, notes),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QK.labOrders.all() });
      queryClient.invalidateQueries({ queryKey: QK.labOrders.detail(response.data.id) });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.labQueue() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.summary() });
      queryClient.setQueryData(QK.labOrders.detail(response.data.id), response);
    },
  });
};

export const useEnterLabResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: UpsertLabResultPayload }) =>
      labService.enterResult(orderId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: QK.labOrders.all() });
      queryClient.invalidateQueries({ queryKey: QK.labOrders.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: QK.labResults.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.labQueue() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.summary() });
      queryClient.setQueryData(QK.labResults.detail(variables.orderId), response);
    },
  });
};

export const useUpdateLabResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: UpsertLabResultPayload }) =>
      labService.updateResult(orderId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: QK.labOrders.all() });
      queryClient.invalidateQueries({ queryKey: QK.labOrders.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: QK.labResults.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.labQueue() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.summary() });
      queryClient.setQueryData(QK.labResults.detail(variables.orderId), response);
    },
  });
};

export const useApproveLabResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (orderId: string) => labService.approveResult(orderId),
    onSuccess: (response, orderId) => {
      queryClient.invalidateQueries({ queryKey: QK.labOrders.all() });
      queryClient.invalidateQueries({ queryKey: QK.labOrders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: QK.labResults.all() });
      queryClient.invalidateQueries({ queryKey: QK.labResults.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.labQueue() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.summary() });
      queryClient.invalidateQueries({ queryKey: QK.notifications.unread() });

      const cachedOrder = queryClient.getQueryData<any>(QK.labOrders.detail(orderId));
      const patientId = cachedOrder?.data?.patientId || cachedOrder?.patientId;
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: QK.patients.detail(patientId) });
        queryClient.invalidateQueries({ queryKey: QK.patients.labOrders(patientId) });
      }

      toast.success('Lab result approved');
    },
  });
};

export const useLabCatalog = (params: { showAll?: boolean } = {}) =>
  useQuery({
    queryKey: labKeys.catalogList(params),
    queryFn: () => labService.listCatalog(params),
  });

export const useCreateCatalogItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof labService.createCatalogItem>[0]) => labService.createCatalogItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.catalog() });
    },
  });
};

export const useUpdateCatalogItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof labService.updateCatalogItem>[1] }) =>
      labService.updateCatalogItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.catalog() });
    },
  });
};

export const useToggleCatalogItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => labService.toggleCatalogItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labKeys.catalog() });
    },
  });
};
