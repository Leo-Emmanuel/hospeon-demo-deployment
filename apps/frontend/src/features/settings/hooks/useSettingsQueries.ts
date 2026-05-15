import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';

export const settingsKeys = {
  all: ['settings'] as const,
  departments: () => [...settingsKeys.all, 'departments'] as const,
  staff: () => [...settingsKeys.all, 'staff'] as const,
};

export const useDepartments = () =>
  useQuery({
    queryKey: settingsKeys.departments(),
    queryFn: () => departmentService.list(),
  });

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => departmentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.departments() });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; description?: string } }) =>
      departmentService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.departments() });
    },
  });
};

export const useStaff = () =>
  useQuery({
    queryKey: settingsKeys.staff(),
    queryFn: () => userService.list(),
  });

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => userService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.staff() });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => userService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.staff() });
    },
  });
};

export const useToggleStaffActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.staff() });
    },
  });
};
