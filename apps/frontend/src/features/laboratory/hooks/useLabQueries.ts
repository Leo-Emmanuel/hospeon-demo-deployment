import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labService, LabOrderListParams, UpsertLabResultPayload } from '@/services/labService';

export const labKeys = {
  all: ['lab'] as const,
  orders: () => [...labKeys.all, 'orders'] as const,
  orderList: (params: LabOrderListParams) => [...labKeys.orders(), params] as const,
  orderDetail: (id: string) => [...labKeys.all, 'order', id] as const,
  resultDetail: (orderId: string) => [...labKeys.all, 'result', orderId] as const,
  catalog: () => [...labKeys.all, 'catalog'] as const,
  catalogList: (params: { showAll?: boolean }) => [...labKeys.catalog(), params] as const,
};

export const useLabOrders = (params: LabOrderListParams) =>
  useQuery({
    queryKey: labKeys.orderList(params),
    queryFn: () => labService.listOrders(params),
    refetchInterval: 30000,
    placeholderData: (previousData) => previousData,
  });

export const useLabOrder = (id: string) =>
  useQuery({
    queryKey: labKeys.orderDetail(id),
    queryFn: () => labService.getOrder(id),
    enabled: Boolean(id),
  });

export const useLabResult = (orderId: string) =>
  useQuery({
    queryKey: labKeys.resultDetail(orderId),
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
      queryClient.invalidateQueries({ queryKey: labKeys.orders() });
      queryClient.setQueryData(labKeys.orderDetail(response.data.id), response);
    },
  });
};

export const useEnterLabResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: UpsertLabResultPayload }) =>
      labService.enterResult(orderId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: labKeys.orders() });
      queryClient.setQueryData(labKeys.resultDetail(variables.orderId), response);
    },
  });
};

export const useUpdateLabResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: UpsertLabResultPayload }) =>
      labService.updateResult(orderId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: labKeys.orders() });
      queryClient.setQueryData(labKeys.resultDetail(variables.orderId), response);
    },
  });
};

export const useApproveLabResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => labService.approveResult(orderId),
    onSuccess: (response, orderId) => {
      queryClient.invalidateQueries({ queryKey: labKeys.orders() });
      queryClient.setQueryData(labKeys.resultDetail(orderId), response);
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
