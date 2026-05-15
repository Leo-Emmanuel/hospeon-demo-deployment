import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/services/patientService';

export interface DepartmentRecord {
  id: string;
  name: string;
  description?: string | null;
  headDoctorId?: string | null;
  headDoctor?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

export const departmentService = {
  list: async (): Promise<ApiResponse<DepartmentRecord[]>> => apiClient.get('/departments'),
  create: async (payload: { name: string; description?: string }): Promise<ApiResponse<DepartmentRecord>> =>
    apiClient.post('/departments', payload),
  update: async (id: string, payload: { name?: string; description?: string }): Promise<ApiResponse<DepartmentRecord>> =>
    apiClient.put(`/departments/${id}`, payload),
};
