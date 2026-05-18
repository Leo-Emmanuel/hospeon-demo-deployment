import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService, AppointmentListParams, CreateAppointmentPayload } from '@/services/appointmentService';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { QK } from '@/lib/queryKeys';

export const useAppointments = (params: AppointmentListParams) =>
  useQuery({
    queryKey: QK.appointments.list(params),
    queryFn: () => appointmentService.list(params),
    placeholderData: (previousData) => previousData,
  });

export const useMyAppointments = (params: AppointmentListParams) =>
  useQuery({
    queryKey: QK.appointments.list({ ...params, scope: 'my' }),
    queryFn: () => appointmentService.listMy(params),
    placeholderData: (previousData) => previousData,
  });

export const useAppointment = (id: string) =>
  useQuery({
    queryKey: QK.appointments.detail(id),
    queryFn: () => appointmentService.getById(id),
    enabled: Boolean(id),
  });

export const useAppointmentSlots = (doctorId?: string, date?: string) =>
  useQuery({
    queryKey: QK.appointments.slots(doctorId, date),
    queryFn: () => appointmentService.getSlots(doctorId as string, date as string),
    enabled: Boolean(doctorId && date),
  });

export const useDepartments = () =>
  useQuery({
    queryKey: QK.departments.all(),
    queryFn: () => departmentService.list(),
  });

export const useDoctors = () =>
  useQuery({
    queryKey: QK.users.doctors(),
    queryFn: () => userService.listDoctors(),
  });

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => appointmentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.appointments.all() });
    },
  });
};
