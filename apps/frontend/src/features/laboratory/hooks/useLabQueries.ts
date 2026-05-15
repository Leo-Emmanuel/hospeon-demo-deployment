import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labService, LabOrderListParams, UpsertLabResultPayload } from '@/services/labService';

export const labKeys = {
  all: ['lab'] as const,
  orders: () => [...labKeys.all, 'orders'] as const,
  orderList: (params: LabOrderListParams) => [...labKeys.orders(), params] as const,
  orderDetail: (id: string) => [...labKeys.all, 'order', id] as const,
  resultDetail: (orderId: string) => [...labKeys.all, 'result', orderId] as const,
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
    }: {
      id: string;
      status: 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTED' | 'APPROVED' | 'CANCELLED';
    }) => labService.updateOrderStatus(id, status),
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
