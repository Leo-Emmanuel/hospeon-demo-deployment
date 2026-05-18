import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  consultationService,
  CompleteVisitPayload,
  ConsultationPayload,
  LabOrderPayload,
  PrescriptionPayload,
} from '@/services/consultationService';

import { QK } from '@/lib/queryKeys';

export const consultationKeys = {
  labTests: () => ['consultations', 'lab-tests'] as const,
};

export const useConsultation = (id: string) =>
  useQuery({
    queryKey: QK.consultations.detail(id),
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
      queryClient.setQueryData(QK.consultations.detail(response.data.id), response);
    },
  });
};

export const useUpdateConsultation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<ConsultationPayload, 'visitId'> }) =>
      consultationService.update(id, payload),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(QK.consultations.detail(variables.id), response);
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
      queryClient.setQueryData(QK.consultations.detail(response.data.id), response);
    },
  });
};

export const useCompleteVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteVisitPayload) => consultationService.completeVisit(payload),
    onSuccess: (response) => {
      const { consultation } = response.data as any;
      const patientId = consultation?.patientId;

      queryClient.invalidateQueries({ queryKey: QK.visits.all() });
      queryClient.invalidateQueries({ queryKey: QK.visits.today() });
      queryClient.invalidateQueries({ queryKey: QK.consultations.all() });
      if (consultation?.id) queryClient.invalidateQueries({ queryKey: QK.consultations.detail(consultation.id) });
      queryClient.invalidateQueries({ queryKey: QK.labOrders.all() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.opdQueue() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.labQueue() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.summary() });
      queryClient.invalidateQueries({ queryKey: QK.dashboard.activity() });
      
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: QK.patients.detail(patientId) });
        queryClient.invalidateQueries({ queryKey: QK.patients.visits(patientId) });
        queryClient.invalidateQueries({ queryKey: QK.patients.consultations(patientId) });
        queryClient.invalidateQueries({ queryKey: QK.patients.labOrders(patientId) });
        queryClient.invalidateQueries({ queryKey: QK.patients.prescriptions(patientId) });
      }
    },
  });
};
