import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  consultationService,
  ConsultationPayload,
  LabOrderPayload,
  PrescriptionPayload,
} from '@/services/consultationService';

export const consultationKeys = {
  all: ['consultations'] as const,
  details: () => [...consultationKeys.all, 'detail'] as const,
  detail: (id: string) => [...consultationKeys.details(), id] as const,
  labTests: () => [...consultationKeys.all, 'lab-tests'] as const,
};

export const useConsultation = (id: string) =>
  useQuery({
    queryKey: consultationKeys.detail(id),
    queryFn: () => consultationService.getById(id),
    enabled: Boolean(id),
  });

export const useLabTestsCatalog = () =>
  useQuery({
    queryKey: consultationKeys.labTests(),
    queryFn: () => consultationService.getLabTestsCatalog(),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateConsultation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConsultationPayload) => consultationService.create(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(consultationKeys.detail(response.data.id), response);
    },
  });
};

export const useUpdateConsultation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<ConsultationPayload, 'visitId'> }) =>
      consultationService.update(id, payload),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(consultationKeys.detail(variables.id), response);
    },
  });
};

export const useCreatePrescriptions = () =>
  useMutation({
    mutationFn: ({ consultationId, prescriptions }: { consultationId: string; prescriptions: PrescriptionPayload[] }) =>
      consultationService.createPrescriptions(consultationId, prescriptions),
  });

export const useCreateLabOrder = () =>
  useMutation({
    mutationFn: (payload: LabOrderPayload) => consultationService.createLabOrder(payload),
  });

export const useCompleteConsultation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => consultationService.complete(id),
    onSuccess: (response) => {
      queryClient.setQueryData(consultationKeys.detail(response.data.id), response);
    },
  });
};
