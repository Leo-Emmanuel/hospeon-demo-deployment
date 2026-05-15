import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreatePatientPayload,
  patientService,
  PatientListParams,
  UpdatePatientPayload,
} from '@/services/patientService';

export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (params: PatientListParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

export const usePatients = (params: PatientListParams) =>
  useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientService.list(params),
    placeholderData: (previousData) => previousData,
  });

export const usePatient = (id: string) =>
  useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientService.getById(id),
    enabled: Boolean(id),
  });

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePatientPayload) => patientService.create(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.setQueryData(patientKeys.detail(response.data.id), response);
    },
  });
};

export const useUpdatePatient = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePatientPayload) => patientService.update(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.setQueryData(patientKeys.detail(id), response);
    },
  });
};
