import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreatePatientPayload,
  patientService,
  PatientListParams,
  UpdatePatientPayload,
} from '@/services/patientService';

import { QK } from '@/lib/queryKeys';

export const usePatients = (params: PatientListParams) =>
  useQuery({
    queryKey: QK.patients.list(params),
    queryFn: () => patientService.list(params),
    placeholderData: (previousData) => previousData,
  });

export const usePatient = (id: string) =>
  useQuery({
    queryKey: QK.patients.detail(id),
    queryFn: () => patientService.getById(id),
    enabled: Boolean(id),
  });

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePatientPayload) => patientService.create(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QK.patients.all() });
      queryClient.setQueryData(QK.patients.detail(response.data.id), response);
    },
  });
};

export const useUpdatePatient = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePatientPayload) => patientService.update(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QK.patients.all() });
      queryClient.setQueryData(QK.patients.detail(id), response);
    },
  });
};
